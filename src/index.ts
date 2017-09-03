import { GraphQLSchema, GraphQLObjectType, GraphQLResolveInfo, GraphQLFieldMap } from 'graphql'
import * as minimatch from 'minimatch'
import * as _ from 'lodash'
import { fieldMapToFieldConfigMap } from './util'

export type Resolver = (args: any) => Promise<any> | any
export type ResolverMapper = ({ args: any, resolve: Resolver }) => Promise<any> | any
export type Rule = boolean | ResolverMapper

export interface Rules {
  // key: query or mutation name (can be glob pattern)
  [key: string]: Rule
}

export function transformSchema(schema: GraphQLSchema, rules: Rules): GraphQLSchema {
  const newRules = prepareRules(rules, schema)

  return new GraphQLSchema({
    query: prepareQueryType(schema, newRules),
    mutation: prepareMutationType(schema, newRules),
  })
}

function prepareQueryType(schema: GraphQLSchema, rules: Rules): GraphQLObjectType {
  const type = schema.getQueryType()
  const fields = { ...type.getFields() }
  Object.keys(fields).forEach(fieldName => transformField(fields, fieldName, rules[fieldName]))

  const newQueryType = new GraphQLObjectType({
    name: type.name,
    description: type.description,
    isTypeOf: type.isTypeOf,
    fields: fieldMapToFieldConfigMap(fields),
    interfaces: type.getInterfaces(),
  })

  return newQueryType
}

function prepareMutationType(schema: GraphQLSchema, rules: Rules): GraphQLObjectType | undefined {
  const type = schema.getMutationType()

  if (!type) {
    return
  }

  const fields = { ...type.getFields() }
  Object.keys(fields).forEach(fieldName => transformField(fields, fieldName, rules[fieldName]))

  if (Object.keys(fields).length === 0) {
    return
  }

  const newMutationType = new GraphQLObjectType({
    name: type.name,
    description: type.description,
    isTypeOf: type.isTypeOf,
    fields: fieldMapToFieldConfigMap(fields),
    interfaces: type.getInterfaces(),
  })

  return newMutationType
}

function transformField(fields: GraphQLFieldMap<any, any>,
  fieldName: string,
  rule: Rule,
): void {
  if (rule === false) {
    delete fields[fieldName]
  } else if (typeof rule === 'function') {
    const oldResolve = fields[fieldName].resolve!

    fields[fieldName].resolve = (root: any, args: any, context: any, info: GraphQLResolveInfo) => {
      const resolve = (_args: any) => oldResolve(root, _args, context, info)
      return rule({ args, resolve })
    }
  }
}

function prepareRules(rules: Rules, schema: GraphQLSchema): Rules {
  const queryFields = schema.getQueryType().getFields()
  const mutationFields = schema.getMutationType() ? schema.getMutationType()!.getFields() : {}
  const allFields = { ...queryFields, ...mutationFields }
  const allFieldNames = Object.keys(allFields)

  // warning for inexisting fields
  const inexistingFieldNames = Object.keys(rules)
    .filter(r => !r.includes('*'))
    .filter(fieldName => !allFieldNames.includes(fieldName))

  for (const fieldName of inexistingFieldNames) {
    console.warn(`Warning: No such query/mutation in schema: "${fieldName}"`)
  }

  // keep everything by default
  let newRules: Rules = allFieldNames.reduce((obj, f) => ({ ...obj, [f]: true }), {})

  // apply `false` rules
  const falseRuleKeys = Object.keys(rules).filter(k => rules[k] === false)
  const falseFieldNames = allFieldNames.filter(fieldName =>
    falseRuleKeys.some(pattern => minimatch(fieldName, pattern))
  )
  for (const fieldName of falseFieldNames) {
    newRules[fieldName] = false
  }

  // overwrite with non-`false` rules
  const nonFalseRuleKeys = Object.keys(rules).filter(k => rules[k] !== false)
  const nonFalseFieldNames = allFieldNames.filter(fieldName =>
    nonFalseRuleKeys.some(pattern => minimatch(fieldName, pattern))
  )

  for (const fieldName of nonFalseFieldNames) {
    const matchedRules = _.chain(rules)
      .pickBy((val, key) => val !== false && minimatch(fieldName, key))
      .values<Rule>()
      .value()

    if (matchedRules.length > 0) {
      newRules[fieldName] = matchedRules[0]
    }
  }

  return newRules
}