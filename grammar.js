/**
 * @file Tessera grammar for tree-sitter
 * @author AndreRojasMartinsson
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//
const PREC = {
	call: 16,
	field: 15,
	try: 14,
	unary: 12,
	cast: 11,
	multiplicative: 10,
	additive: 9,
	concat: 8,
	shift: 8,
	bitand: 7,
	bitxor: 6,
	bitor: 5,
	comparative: 4,
	and: 3,
	or: 2,
	range: 1,
	assign: 0,
	closure: -1,
};
const numericTypes = [
	"u8",
	"i8",
	"u16",
	"i16",
	"u32",
	"i32",
	"u64",
	"i64",
	"i128",
	"u128",
	"isz",
	"usz",
	"float",
	"double",
];

const primitiveTypes = numericTypes.concat(["bool", "str", "char", "void", "infer"]);

module.exports = grammar({
	name: "tessera",
	extras: $ => [/\s+/, $.comment],

	supertypes: $ => [
		$._expression,
		$._type,
		$._literal,
		$._literal_pattern,
		$._declaration_statement,
		$._pattern,
	],

	inline: $ => [
		$._type_identifier,
		$._field_identifier,
		$._declaration_statement,
		$._expression_ending_with_block,
	],

	word: $ => $.identifier,

	conflicts: $ => [
		[$._type, $._pattern],
		[$.scoped_identifier, $.scoped_type_identifier],
		[$.parameters, $._pattern],
		[$.visibility_modifier],
		[$.visibility_modifier, $.scoped_identifier, $.scoped_type_identifier],
		[$._expression_except_range, $._type],
		[$._path, $._type],
		[$._path, $._pattern],
		[$._pattern, $.range_pattern],
		[$.range_pattern],
		[$._expression_except_range, $._path],
	],

	rules: {
		// ROOT
		source_file: $ => repeat(choice($._statement, $._top_level_items)),
		_top_level_items: $ => choice($.module_item, $.using_item),
		_statement: $ => choice($._declaration_statement, $.expression_statement),

		module_item: $ => seq("module", field("name", $.identifier), field("body", $.block)),
		using_item: $ => seq("using", $.use_path, optional($.use_suffix), ";"),

		use_path: $ => prec.right(seq($.identifier, repeat(seq(":", $.identifier)))),

		use_suffix: $ => choice(seq(":", "*"), seq(":", "{", commaSep1($.use_list_item), "}")),

		use_list_item: $ => seq($.use_path, optional($.use_suffix)),

		empty_statement: _ => ";",

		expression_statement: $ =>
			choice(seq($._expression, ";"), prec(1, $._expression_ending_with_block)),

		_expression_ending_with_block: $ =>
			choice(
				$.block,
				$.if_expression,
				$.match_expression,
				$.while_expression,
				$.for_expression,
				$.for_in_expression,
			),

		_declaration_statement: $ =>
			choice(
				$.const_item,
				$.empty_statement,
				$.extern_function_item,
				$.function_item,
				$.variable_declaration,
			),

		// Items
		const_item: $ =>
			prec.right(
				PREC.assign,
				seq(
					optional($.visibility_modifier),
					"const",
					field("type", $._type),
					field("name", $.identifier),
					optional(seq(":=", field("value", $._expression))),
					";",
				),
			),

		extern_function_item: $ =>
			seq(
				"extern",
				"fn",
				field("return_type", $._type),
				field("name", $.identifier),
				field("parameters", $.parameters),
				";",
			),

		function_item: $ =>
			seq(
				optional($.visibility_modifier),
				optional("const"),
				"fn",
				field("return_type", $._type),
				field("name", $.identifier),
				field("parameters", $.parameters),
				field("body", $.block),
			),

		block: $ =>
			seq(optional(seq($.label, ":")), "{", repeat($._statement), optional($._expression), "}"),

		// Expression
		_expression: $ => choice($._expression_except_range, $.range_expression),

		_expression_except_range: $ =>
			choice(
				$.unary_expression,
				$.reference_expression,
				$.binary_expression,
				$.assignment_expression,
				$.compound_assignment_expr,
				$.type_cast_expression,
				$.call_expression,
				$.name_expr,
				$.return_expression,
				$._literal,
				prec.left($.identifier),
				alias(choice(...primitiveTypes), $.identifier),
				$.self,
				$.scoped_identifier,
				$.break_expression,
				$.continue_expression,
				$.parenthesized_expression,
				$._expression_ending_with_block,
			),

		name_expr: $ =>
			prec.left(
				PREC.field,
				seq(field("object", $._expression), ".", field("property", $._field_identifier)),
			),

		range_expression: $ =>
			prec.left(
				PREC.range,
				choice(
					seq($._expression, choice("..", "...", "..="), $._expression),
					seq($._expression, ".."),
					seq("..", $._expression),
					"..",
				),
			),

		unary_expression: $ => prec(PREC.unary, seq(choice("-", "*", "!"), $._expression)),

		reference_expression: $ =>
			prec(PREC.unary, seq("&", optional($.mutable_specifier), field("value", $._expression))),

		binary_expression: $ => {
			const table = [
				[PREC.and, "&&"],
				[PREC.or, "||"],
				[PREC.bitand, "&"],
				[PREC.bitor, "|"],
				[PREC.bitxor, "^"],
				[PREC.comparative, choice("=", "!=", "<", "<=", ">", ">=")],
				[PREC.shift, choice("<<", ">>")],
				[PREC.concat, "<>"],
				[PREC.additive, choice("+", "-")],
				[PREC.multiplicative, choice("*", "/", "%")],
			];

			return choice(
				...table.map(([precedence, operator]) =>
					prec.left(
						// @ts-ignore
						precedence,
						seq(
							field("left", $._expression),
							// @ts-ignore
							field("operator", operator),
							field("right", $._expression),
						),
					),
				),
			);
		},

		assignment_expression: $ =>
			prec.left(
				PREC.assign,
				seq(field("left", $._expression), ":=", field("right", $._expression)),
			),

		compound_assignment_expr: $ =>
			prec.left(
				PREC.assign,
				seq(
					field("left", $._expression),
					field(
						"operator",
						choice("+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", "<>="),
					),
					field("right", $._expression),
				),
			),

		type_cast_expression: $ =>
			prec.left(PREC.cast, seq(field("value", $._expression), "as", field("type", $._type))),

		return_expression: $ => choice(prec.left(seq("|>", $._expression)), prec(-1, "|>")),

		call_expression: $ =>
			prec(
				PREC.call,
				seq(field("function", $._expression_except_range), field("arguments", $.arguments)),
			),

		arguments: $ => seq("(", sepBy(",", $._expression), optional(","), ")"),

		parenthesized_expression: $ => seq("(", $._expression, ")"),

		break_expression: $ => prec.left(seq("break", optional($.label), optional($._expression))),
		continue_expression: $ => prec.left(seq("continue", optional($.label))),

		if_expression: $ =>
			prec.right(
				seq(
					"if",
					field("condition", $._expression),
					field("consequence", $.block),
					optional(field("alternative", $.else_clause)),
				),
			),

		else_clause: $ => seq("else", choice($.block, $.if_expression)),

		match_expression: $ =>
			seq("match", field("value", $._expression), field("body", $.match_block)),

		match_block: $ =>
			seq("{", optional(seq(repeat($.match_arm), alias($.last_match_arm, $.match_arm))), "}"),

		match_arm: $ =>
			prec.right(
				seq(
					field("pattern", $.match_pattern),
					"->",
					choice(
						seq(field("value", $._expression), ","),
						field("value", prec(1, $._expression_ending_with_block)),
					),
				),
			),

		last_match_arm: $ =>
			seq(field("pattern", $.match_pattern), "->", field("value", $._expression), optional(",")),

		match_pattern: $ => seq($._pattern, optional(seq("if", field("condition", $._expression)))),

		_path: $ =>
			choice(
				$.self,
				alias(choice(...primitiveTypes), $.identifier),
				$.super,
				$.crate,
				$.identifier,
				$.scoped_identifier,
			),

		scoped_identifier: $ =>
			seq(field("path", optional($._path)), ":", field("name", choice($.identifier, $.super))),

		scoped_type_identifier_in_expression_position: $ =>
			prec(-2, seq(field("path", optional($._path)), ":", field("name", $._type_identifier))),

		scoped_type_identifier: $ =>
			seq(field("path", optional($._path)), ":", field("name", $._type_identifier)),

		_pattern: $ =>
			choice(
				$._literal_pattern,
				alias(choice(...primitiveTypes), $.identifier),
				$.identifier,
				$.scoped_identifier,
				$.ref_pattern,
				$.reference_pattern,
				$.remaining_field_pattern,
				$.mut_pattern,
				$.range_pattern,
				$.or_pattern,
				"_",
			),

		reference_pattern: $ => seq("&", optional($.mutable_specifier), $._pattern),
		remaining_field_pattern: _ => "..",

		mut_pattern: $ => prec(-1, seq($.mutable_specifier, $._pattern)),

		range_pattern: $ =>
			seq($._literal_pattern, choice(seq(choice("...", "..=", ".."), $._literal_pattern), "..")),

		ref_pattern: $ => seq("ref", $._pattern),

		or_pattern: $ => prec.left(-2, choice(seq($._pattern, "|", $._pattern), seq("|", $._pattern))),

		while_expression: $ =>
			seq(
				optional(seq($.label, ":")),
				"while",
				field("condition", $._expression),
				field("body", $.block),
			),

		for_in_expression: $ =>
			seq(
				optional(seq($.label, ":")),
				"for",
				field("type", $._type),
				field("name", $.identifier),
				"in",
				field("expr", $._expression),
				field("body", $.block),
			),

		for_expression: $ =>
			seq(
				optional(seq($.label, ":")),
				"for",
				field("initializer", $.variable_declaration),
				",",
				field("condition", $._expression),
				",",
				field("updater", $._expression_except_range),
				field("body", $.block),
			),

		label: $ => seq("$", $.identifier),

		variable_declaration: $ =>
			seq(
				optional($.mutable_specifier),
				field("type", $._type),
				field("pattern", $._pattern),
				optional($.variable_initializer),
			),

		variable_initializer: $ => seq(":=", field("value", $._expression)),

		// Other
		parameters: $ =>
			seq(
				"(",
				sepBy(",", choice($.parameter, $.self_parameter, $.variadic_parameter, "_")),
				optional(","),
				")",
			),

		parameter: $ =>
			seq(
				field("type", $._type),
				optional($.mutable_specifier),
				field("name", choice($.identifier, "self")),
			),

		self_parameter: $ => seq(optional("&"), optional($.mutable_specifier), "self"),

		variadic_parameter: $ =>
			seq(
				optional($.mutable_specifier),
				field("type", $._type),
				"...",
				field("name", $.identifier),
			),

		// Modifiers
		// function_modifiers: _ => repeat1(choice("const", "extern")),

		visibility_modifier: $ => seq("pub", optional(seq("(", choice($.self, $.super, $.crate), ")"))),

		// TYPES
		self: _ => "self",
		super: _ => "super",
		crate: _ => "crate",

		_type: $ =>
			choice(
				$.reference_type,
				$.scoped_type_identifier,
				$._type_identifier,
				$.never_type,
				alias(choice(...primitiveTypes), $.primitive_type),
			),

		reference_type: $ => seq("&", optional($.mutable_specifier), field("type", $._type)),
		never_type: _ => "!",
		mutable_specifier: _ => "mut",

		// MISC
		// LITERALS & IDENTIFIERS
		identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
		boolean_literal: _ => choice("true", "false"),
		string_literal: $ => seq('"', /[^"\n]*/, '"'),
		negative_literal: $ => seq("-", choice($.integer_literal, $.float_literal)),
		_literal_pattern: $ =>
			choice(
				$.string_literal,
				$.char_literal,
				$.boolean_literal,
				$.integer_literal,
				$.float_literal,
				$.negative_literal,
			),
		_literal: $ =>
			choice(
				$.string_literal,
				$.char_literal,
				$.boolean_literal,
				$.integer_literal,
				$.float_literal,
			),
		integer_literal: _ =>
			token(
				seq(
					choice(/[0-9][0-9_]*/, /0x[0-9a-fA-F_]+/, /0b[01_]+/, /0o[0-7_]+/),
					optional(choice(...numericTypes)),
				),
			),
		float_literal: _ =>
			token(
				seq(
					/(?:(?:\d+\.\d*)(?:[eE][+-]?\d+)?| \.\d+(?:[eE][+-]?\d+)?| \d+(?:[eE][+-]?\d+))/,
					optional(choice(...numericTypes)),
				),
			),
		char_literal: _ =>
			token(
				seq(
					optional("b"),
					"'",
					optional(
						choice(
							seq("\\", choice(/[^xu]/, /u[0-9a-fA-F]{4}/, /u\{[0-9a-fA-F]+\}/, /x[0-9a-fA-F]{2}/)),
							/[^\\']/,
						),
					),
					"'",
				),
			),
		escape_sequence: _ =>
			token.immediate(
				seq("\\", choice(/[^xu]/, /u[0-9a-fA-F]{4}/, /u\{[0-9a-fA-F]+\}/, /x[0-9a-fA-F]{2}/)),
			),

		_type_identifier: $ => alias($.identifier, $.type_identifier),
		_field_identifier: $ => alias($.identifier, $.field_identifier),

		// COMMENTS
		comment: $ => token(choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))),
	},
});

// Utility function for comma-separated lists
function commaSep(rule) {
	return seq(rule, repeat(seq(",", rule)));
}

function commaSep1(rule) {
	return seq(rule, repeat(seq(",", rule)));
}
/**
 * Creates a rule to match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function sepBy1(sep, rule) {
	return seq(rule, repeat(seq(sep, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function sepBy(sep, rule) {
	return optional(sepBy1(sep, rule));
}
