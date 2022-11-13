import schema from './schema.json' assert { type: 'json' };;

const input = {
  name: 'John Person',
  role: 'proctor',
  parentOf: 'Connie'
}

// an example of a form specification
const EXAMPLE_SPEC: FormSpecification = schema as FormSpecification;
const line = '\n---------------------------------------------------------------\n';
console.log(line + validFormInput(EXAMPLE_SPEC, input) + line);

export type FormSpecification = TitledItem & {
  fields: FormFieldSpecification[];
}

export type FormFieldSpecification = TitledItem & FormFieldVariant;

type StringFieldType = 'name' | 'text';

type DateFieldType = 'date' | 'time' | 'future-time';

type IntervalFieldType = 'interval' | 'future-interval';

type LocationFieldType = 'location';

type OptionsFieldType = 'options';

export type FormFieldType = StringFieldType | DateFieldType | IntervalFieldType | LocationFieldType | OptionsFieldType;

interface IdItem {
  id: string;
}

interface TitledItem {
  id: string;
  title: string;
}

type FormFieldVariantFor<Variant, Type> = {
  type: Variant
} & {
  optional?: boolean;
  defaultValue?: Type;
}

type FormFieldVariant =
  FormFieldVariantFor<StringFieldType, string>
| FormFieldVariantFor<LocationFieldType, Location>
| FormFieldVariantFor<DateFieldType, Date>
| (FormFieldVariantFor<OptionsFieldType, string> & {
  options: Option[];
})

type Option = TitledItem & {
  hiddenFields?: FormFieldSpecification[];
}

type FormValues = {
  [key in string]: unknown;
};

function validFormInput(spec: FormSpecification, values: FormValues): boolean {
  return validFormFieldInputs(spec.fields, values);
}

function validFormFieldInputs(fields: FormFieldSpecification[], values: FormValues): boolean {
  for (let field of fields) {
    if (!values[field.id]) {
      if (field.optional) {
        continue;
      } else {
        console.log('missing field ' + field.id)
        return false;
      }
    }
    if (!validFormFieldInput(field, values)) {
      console.log('invalid field: ' + field.id)
      return false;
    }
  }
  return true;
}

function validFormFieldInput(spec: FormFieldSpecification, values: FormValues) {
  const value: unknown = values[spec.id];
  switch (spec.type) {
    case 'name':
      return isString(value);
    case 'text':
      return isString(value);
    case 'date':
      return isDate(value);
    case 'time':
      return isDate(value);
    case 'future-time':
      return isDate(value) && value as Date > new Date();
    case 'location':
      // TODO: put some real validation here!
      return true;
    case 'options':
      if (!isString(value)) {
        return false;
      }
      for (let option of spec.options) {
        if (option.id == value) {
          return !option.hiddenFields || validFormFieldInputs(option.hiddenFields, values);
        }
      }
      return false;
  }
}

function isString(value: unknown): boolean {
  return typeof value === 'string' || value instanceof String;
}

function isDate(value: unknown) {
  return value instanceof Date;
}