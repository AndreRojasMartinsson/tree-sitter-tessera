; Identifiers

(type_identifier) @type
(primitive_type) @type.builtin
; (field_identifier) @property

; Identifier conventions

; Assume all-caps names are constants
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'"))

; Assume uppercase names are enum constructors
((identifier) @constructor
 (#match? @constructor "^[A-Z]"))

; Assume that uppercase names in paths are types
((scoped_identifier
  path: (identifier) @type)
 (#match? @type "^[A-Z]"))

((scoped_identifier
  path: (scoped_identifier
    name: (identifier) @type))
 (#match? @type "^[A-Z]"))

((scoped_type_identifier
  path: (identifier) @type)
 (#match? @type "^[A-Z]"))

((scoped_type_identifier
  path: (scoped_identifier
    name: (identifier) @type))
 (#match? @type "^[A-Z]"))

; Function calls

"$" @string
"\"" @string

(while_expression
  (label
    "$"       @string
    (identifier) @label.definition))
(for_expression
  (label
    "$"       @string
    (identifier) @label.definition))
(for_in_expression
  (label
    "$"       @string
    (identifier) @label.definition))

(break_expression
  (label
    "$"       @string
    (identifier) @label.reference))
(continue_expression
  (label
    "$"       @string
    (identifier) @label.reference))

(call_expression
  function: (identifier) @function)
(call_expression
  function: (scoped_identifier
    ":"
    name: (identifier) @function))

(name_expr
  property: (field_identifier) @variable)

[
  ;; method‐ or property‐style calls: foo.bar.baz()
  (call_expression
    function: (name_expr
                property: (field_identifier) @function))

  ;; simple calls: foo()
  (call_expression
    function: (identifier) @function)
]


 

; Using definitions
((using_item) @keyword)
((use_path) @variable.builtin)
((use_list_item) @identifier)


("$" (identifier) @label.definition)

; Function definitions

(function_item (identifier) @function)
(extern_function_item (identifier) @function)

(comment) @comment

(module_item (identifier) @variable.builtin)

(variadic_parameter) @variable.parameter

;;

"(" @punctuation.bracket
")" @punctuation.bracket
; "[" @punctuation.bracket
; "]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

":" @punctuation.delimiter
; "." @punctuation.delimiter
"," @punctuation.delimiter
";" @punctuation.delimiter

(parameter (identifier) @variable.parameter)

"as" @keyword
"break" @keyword
"const" @keyword
"continue" @keyword
"else" @keyword
; "enum" @keyword
"extern" @keyword
"fn" @keyword
"for" @keyword
"if" @keyword
; "impl" @keyword
"in" @keyword
"match" @keyword
"pub" @keyword
"module" @keyword
"ref" @keyword
"|>" @keyword
; "using" @keyword
"while" @keyword
(crate) @keyword
(mutable_specifier) @keyword
(scoped_identifier (self) @keyword)
(super) @keyword

(self) @variable.builtin

(char_literal) @string
(string_literal) @string

(boolean_literal) @constant.builtin
(integer_literal) @constant.builtin
(float_literal) @constant.builtin

"*" @operator
"&" @operator
"..." @operator
".." @operator
"..=" @operator
"!" @operator
"!=" @operator
"%" @operator
"%=" @operator
"&" @operator
"&=" @operator
"*" @operator
"*=" @operator
"+" @operator
"+=" @operator
"-" @operator
"-=" @operator
"/" @operator
"/=" @operator
"<" @operator
"<<" @operator
"<<=" @operator
"<=" @operator
"=" @operator
">" @operator
">=" @operator
">>=" @operator
"^" @operator
"^=" @operator
"|" @operator
"|=" @operator
"||" @operator
"&&" @operator
"<>" @operator
