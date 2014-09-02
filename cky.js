function init() {

    function create2dArray(dim) {
        var arr = new Array(dim);
        for (var i = 0; i < dim; i++) {
            arr[i] = new Array(dim);
            for (var j = 0; j < dim; j++) {
                arr[i][j] = [];
            }
        }
        return arr;
    }

    function parse(grammar, tokens) {
        var tokLen = tokens.length + 1;
        var parseTable = create2dArray(tokLen);

        for (var right = 1; right < tokLen; right++) {
	    var token = tokens[right-1];
            var terminalRules = grammar[token];
            for (var r in terminalRules) {
		var rule = terminalRules[r];
                parseTable[right - 1][right].push({
                    rule: rule,
                    token: token
                });
            }

            for (var left = right - 2; left >= 0; left--) {
                for (var mid = left + 1; mid < right; mid++) {
                    for (var x in parseTable[left][mid]) {
                        for (var y in parseTable[mid][right]) {
                            var rls = grammar[parseTable[left][mid][x]['rule'] + '_' + parseTable[mid][right][y]['rule']]
                            if (rls) {
                                for (var r in rls) {
                                    parseTable[left][right].push({
                                        rule: rls[r],
                                        k: mid,
                                        x: x,
                                        y: y
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        return parseTable;
    }

    function grammarToHashMap(rules) {
        var hashMap = {};
        for (var i in rules) {
            var rule = rules[i];
            var parts = rule.split('->');
            var root = parts[0].trim();
            var childs = (parts[1].trim()).split(' ');
            var key = childs[0];
            if (childs.length == 2) {
                var key = childs[0] + '_' + childs[1];
            }
            if (!hashMap[key]) {
                hashMap[key] = [];
            }
            hashMap[key].push(root);
        }
        return hashMap;
    }

    function traverseParseTable(parseTable, i, j, x) {
        if (!parseTable[i][j][x]['k']) {
            return '<li><a href="#">' + parseTable[i][j][x]['rule'] + '</a><ul><li><a href="#">' + parseTable[i][j][x]['token'] + '</a></li></ul></li>';
        }
        return '<li><a href="#">' + parseTable[i][j][x]['rule'] + '</a><ul>' + traverseParseTable(parseTable, i, parseTable[i][j][x]['k'], parseTable[i][j][x]['x']) + traverseParseTable(parseTable, parseTable[i][j][x]['k'], j, parseTable[i][j][x]['y']) + '</ul></li>';
    }

    // http://en.wikipedia.org/wiki/Chomsky_normal_form
    grammar = [
        'S0 -> Number',
        'S0 -> Variable',
        'S0 -> Open Expr_Close',
        'S0 -> Factor PowOp_Primary',
        'S0 -> Term MulOp_Factor',
        'S0 -> Expr AddOp_Term',
        'S0 -> AddOp Term',

        'Expr -> Number',
        'Expr -> Variable',
        'Expr -> Open Expr_Close',
        'Expr -> Factor PowOp_Primary',
        'Expr -> Term MulOp_Factor',
        'Expr -> Expr AddOp_Term',
        'Expr -> AddOp Term',

        'Term -> Number',
        'Term -> Variable',
        'Term -> Open Expr_Close',
        'Term -> Factor PowOp_Primary',
        'Term -> Term MulOp_Factor',

        'Factor -> Number',
        'Factor -> Variable',
        'Factor -> Open Expr_Close',
        'Factor -> Factor PowOp_Primary',

        'Primary -> Number',
        'Primary -> Variable',
        'Primary -> Open Expr_Close',

        'AddOp -> +',
        'AddOp -> -',

        'MulOp -> *',
        'MulOp -> /',

        'Expr_Close -> Expr Close',
        'PowOp_Primary -> PowOp Primary',
        'MulOp_Factor -> MulOp Factor',
        'AddOp_Term -> AddOp Term',
        'Open -> (',
        'Close -> )',
        'PowOp -> ^'
    ];

    var parseTable = parse(grammarToHashMap(grammar), 'Number ^ Number + Number * Number'.split(' '));

    for (var i in parseTable[0][parseTable.length - 1]) {
        document.body.innerHTML += '<div class="tree" id="displayTree"><ul>' + traverseParseTable(parseTable, 0, parseTable.length - 1, i) + '</ul></div><br/>';
    }

	// http://en.wikipedia.org/wiki/CYK_algorithm#Example
	grammar = [
	'S -> NP VP',
	'VP -> VP PP',
	'VP -> V NP',
	'VP -> eats',
	'PP -> P NP',
	'NP -> Det N',
	'NP -> she',
	'V -> eats',
	'P -> with',
	'N -> fish',
	'N -> fork',
	'Det -> a'
];

    var parseTable = parse(grammarToHashMap(grammar), 'she eats a fish with a fork'.split(' '));

    for (var i in parseTable[0][parseTable.length - 1]) {
        document.body.innerHTML += '<div class="tree" id="displayTree"><ul>' + traverseParseTable(parseTable, 0, parseTable.length - 1, i) + '</ul></div><br/>';
    }


}
