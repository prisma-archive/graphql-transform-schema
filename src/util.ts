import * as _ from 'lodash'
import {
  GraphQLFieldMap,
  GraphQLArgumentConfig,
  GraphQLArgument,
  GraphQLFieldConfigArgumentMap,
  GraphQLField,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
} from 'graphql'

/*
* Based on graphql-tools 
*/
export function fieldMapToFieldConfigMap(fields: GraphQLFieldMap<any, any>): GraphQLFieldConfigMap<any, any> {
  return _.mapValues(fields, field => fieldToFieldConfig(field));
}

function fieldToFieldConfig(field: GraphQLField<any, any>): GraphQLFieldConfig<any, any> {
  return {
    type: field.type,
    args: argsToFieldConfigArgumentMap(field.args),
    resolve: field.resolve,
    description: field.description,
    deprecationReason: field.deprecationReason,
  };
}

function argsToFieldConfigArgumentMap(args: Array<GraphQLArgument>): GraphQLFieldConfigArgumentMap {
  return _.fromPairs(args.map(arg => argumentToArgumentConfig(arg)));
}

function argumentToArgumentConfig(argument: GraphQLArgument): [string, GraphQLArgumentConfig] {
  return [
    argument.name,
    {
      type: argument.type,
      defaultValue: argument.defaultValue,
      description: argument.description,
    },
  ];
}