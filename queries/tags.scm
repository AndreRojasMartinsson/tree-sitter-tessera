; ADT definitions

; function definitions

(function_item
    name: (identifier) @name) @definition.function

; references

(call_expression
    function: (identifier) @name) @reference.call

(call_expression
    function: (field_expression
        field: (field_identifier) @name)) @reference.call

; implementations

