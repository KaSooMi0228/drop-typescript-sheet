import { mapValues } from "lodash";
import { Dictionary } from "./common";

export type SubKeyType = null | "SaltProduct";

export type ExpressionType = AST & {
    subkeyType: SubKeyType;
};

export type RecordMeta<RecordType, JsonType, BrokenJsonType> = {
    type: "record";
    name: string;
    fields: Dictionary<Meta>;
    repair: (value: BrokenJsonType | undefined) => JsonType;
    toJSON: (value: RecordType) => JsonType;
    fromJSON: (value: JsonType) => RecordType;
    functions: Dictionary<{
        fn: any;
        parameterTypes: () => Meta[];
        returnType: Meta;
    }>;
    userFacingKey: string | null;
    segments: Dictionary<string[]>;
};

export type AST =
    | {
          type: "MEMBER";
          base: AST;
          name: string;
      }
    | {
          type: "RECORD" | "KEY";
      }
    | {
          type: "STRING_LITERAL" | "DECIMAL_LITERAL";
          value: string;
      }
    | {
          type:
              | "CONCAT"
              | "MULTIPLY"
              | "SUBTRACT"
              | "ADD"
              | "EQUALS"
              | "AND"
              | "IS_GREATER"
              | "OR";
          left: AST;
          right: AST;
      }
    | {
          type: "NOT" | "IS_NOT_NULL" | "IS_ZERO" | "IS_EMPTY" | "AGE_DAYS";
          expression: AST;
      }
    | {
          type: "FORMAT";
          expression: AST;
      }
    | {
          type: "TO_DECIMAL_PLACES";
          expression: AST;
          places: AST;
      }
    | {
          type: "SUM_MAP" | "LAST_ITEM";
          base: AST;
          expression: AST;
      }
    | {
          type: "FIRST_MATCH";
          base: AST;
          condition: AST;
          expression: AST;
      }
    | {
          type: "JOIN_MAP";
          base: AST;
          seperator: AST;
          expression: AST;
      }
    | {
          type: "CONDITION";
          condition: AST;
          whenTrue: AST;
          whenFalse: AST;
      };

export type Meta =
    | RecordMeta<any, any, any>
    | {
          type:
              | "string"
              | "money"
              | "percentage"
              | "quantity"
              | "money?"
              | "percentage?"
              | "quantity?"
              | "boolean"
              | "version"
              | "date"
              | "phone"
              | "datetime"
              | "null"
              | "binary"
              | "boolean?"
              | "serial";
      }
    | {
          type: "uuid";
          linkTo?: string;
      }
    | {
          type: "array" | "array?";
          items: Meta;
      }
    | {
          type: "enum";
          values: string[];
      };

export function makeDefault(meta: Meta): {} | null {
    switch (meta.type) {
        case "string":
        case "phone":
        case "binary":
            return "";
        case "record":
            return mapValues(meta.fields, (value) => makeDefault(value));
        case "array":
            return [];
        case "money":
        case "percentage":
        case "quantity":
            return "0";
        case "money?":
        case "percentage?":
        case "quantity?":
        case "boolean?":
        case "array?":
            return null;
        case "boolean":
            return false;
        case "uuid":
        case "date":
        case "datetime":
        case "serial":
        case "null":
            return null;
        case "enum":
            return meta.values[0];
        case "version":
            throw new Error("Should not occur");
    }
}
