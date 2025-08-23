# RowForm Field Configuration System

This directory contains the flexible field configuration system for RowForm that supports both global field types and model-specific overrides.

## Files Overview

### `basicTypes.jsx`
Defines fundamental field types that work across all models:
- `text`, `textarea`, `number`, `bool`, `select`
- `email`, `password`, `date`, `datetime`

### `entityTypes.jsx`
Defines entity selection components that can be used across models:
- `statusselect`, `vurderingselect`, `emneselect`, `enhetselect`
- `kravreferansetypeselect`, `kravselect`, `kravstatusselect`
- `parentselect` (for hierarchical relationships)

### `modelSpecific.jsx`
Allows for model-specific field configurations and validation rules:
- Model-specific field name overrides
- Model-specific field type overrides
- Custom validation rules per model

### `fieldResolver.jsx`
Main resolution engine that determines which component to use based on priority:

1. **Model-specific field name override** (highest priority)
2. **Model-specific field type override**
3. **Global entity field type**
4. **Basic field type**
5. **Fallback to text input** (lowest priority)

## Usage

### Basic Usage
The system works automatically with existing model configurations. Just ensure your model configs use the correct `type` values:

```javascript
// In your model config
{
  name: "statusId",
  label: "Status",
  type: "statusselect", // Uses global entity type
  required: true
}
```

### Adding New Global Field Types

#### 1. Basic Types (in `basicTypes.jsx`)
```javascript
export const BASIC_FIELD_TYPES = {
  // ... existing types
  
  url: ({ field, value, onChange, error }) => (
    <input
      type="url"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),
};
```

#### 2. Entity Types (in `entityTypes.jsx`)
```javascript
export const ENTITY_FIELD_TYPES = {
  // ... existing types
  
  userselect: ({ field, value, onChange, error }) => (
    <UserSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),
};
```

### Adding Model-Specific Overrides

#### 1. Field Name Override (in `modelSpecific.jsx`)
```javascript
export const MODEL_SPECIFIC_FIELDS = {
  krav: {
    fieldNames: {
      beskrivelse: ({ field, value, onChange, error }) => (
        <textarea
          name={field.name}
          value={value || ""}
          onChange={onChange}
          placeholder="Detaljert beskrivelse av kravet..."
          rows={5}
          className={`input-base ${error ? "input-error" : "input-default"}`}
          required={field.required}
        />
      ),
    },
    fieldTypes: {
      // Override global field types for this model
    }
  }
};
```

#### 2. Model-Specific Validation (in `modelSpecific.jsx`)
```javascript
export const MODEL_VALIDATION_RULES = {
  krav: {
    tittel: (value) => {
      if (value && value.length < 3) {
        return "Tittel må være minst 3 tegn";
      }
      return null;
    },
    versjon: (value) => {
      if (value && !/^\d+\.\d+$/.test(value)) {
        return "Versjon må være i format X.Y (f.eks. 1.0)";
      }
      return null;
    },
  }
};
```

## Resolution Priority Examples

### Example 1: Standard Field
```javascript
// Model config:
{ name: "tittel", type: "text" }

// Resolution: basicTypes.text (standard text input)
```

### Example 2: Entity Field
```javascript
// Model config:
{ name: "statusId", type: "statusselect" }

// Resolution: entityTypes.statusselect (StatusSelect component)
```

### Example 3: Model-Specific Override
```javascript
// Model config:
{ name: "beskrivelse", type: "text" }

// With krav model:
// Resolution: modelSpecific.krav.fieldNames.beskrivelse (custom textarea)

// With other models:
// Resolution: basicTypes.text (standard text input)
```

### Example 4: Model-Specific Type Override
```javascript
// Model config:
{ name: "someField", type: "text" }

// With custom model having fieldTypes.text override:
// Resolution: modelSpecific.customModel.fieldTypes.text

// With standard model:
// Resolution: basicTypes.text
```

## Benefits

1. **🔄 Truly Generic**: RowForm works with any model without modification
2. **🎯 Flexible**: Support for both global and model-specific configurations
3. **📈 Extensible**: Easy to add new field types and overrides
4. **🔧 Maintainable**: Clear separation of concerns
5. **⚡ Efficient**: Single resolution system handles all cases
6. **🎨 Consistent**: Same patterns across all field types

## Migration from Old System

The old hardcoded approach:
```javascript
field.name === "statusId" ? <StatusSelect /> : ...
```

Becomes the new type-based approach:
```javascript
// Model config uses: type: "statusselect"
// System automatically resolves to StatusSelect component
```

No changes needed to existing model configurations that already use proper type values!
