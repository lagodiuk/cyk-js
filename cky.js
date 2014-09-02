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

        for (var j = 1; j < tokLen; j++) {
            var rls = grammar[tokens[j - 1]];
            for (var r in rls) {
                parseTable[j - 1][j].push({
                    rule: rls[r],
                    token: tokens[j - 1]
                });
            }

            for (var i = j - 2; i >= 0; i--) {
                for (var k = i + 1; k < j; k++) {
                    for (var x in parseTable[i][k]) {
                        for (var y in parseTable[k][j]) {
                            var rls = grammar[parseTable[i][k][x]['rule'] + '_' + parseTable[k][j][y]['rule']]
                            if (rls) {
                                for (var r in rls) {
                                    parseTable[i][j].push({
                                        rule: rls[r],
                                        k: k,
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

    grammarHashMap = {
            'n': ['exp'],
            '(': ['l_par'],
            ')': ['r_par'],
            '+': ['add'],
            '-': ['sub'],
            '*': ['mul'],
            '/': ['div'],
            'l_par_exp2': ['exp'],
            'exp_r_par': ['exp2'],
            'exp_exp3': ['exp'],
            'add_exp': ['exp3'],
            'exp_exp4': ['exp'],
            'sub_exp': ['exp4'],
            'exp_exp5': ['exp'],
            'mul_exp': ['exp5'],
            'exp_exp6': ['exp'],
            'div_exp': ['exp6']
        }
        /*
        E --> number
          E --> l_par E2
          E2 -> E r_par
          E --> E E3
          E3 -> add E
          E --> E E4
          E4 -> sub E
          E --> E E5
          E5 -> mul E
          E --> E E6
          E6 -> div E
        */
        //parse( grammarHashMap, [ '(', 'n', '+', 'n', ')', '+', '(', 'n', '+', 'n', ')', '+', 'n' ] );
        //parse( grammarHashMap, [ 'n', '-', 'n', '+', 'n' ] );

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
            return '<li><a href="#">' + parseTable[i][j][x]['rule'] + '</a><ul>' + '<li><a href="#">' + parseTable[i][j][x]['token'] + '</a></li>' + '</ul>' + '</li>';
        }
        return '<li><a href="#">' + parseTable[i][j][x]['rule'] + '</a><ul>' + traverseParseTable(parseTable, i, parseTable[i][j][x]['k'], parseTable[i][j][x]['x']) + traverseParseTable(parseTable, parseTable[i][j][x]['k'], j, parseTable[i][j][x]['y']) + '</ul>' + '</li>';
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

    //console.log(JSON.stringify(grammarToHashMap(grammar), null, 4));
    var parseTable = parse(grammarToHashMap(grammar), 'Number ^ Number + Number * Number'.split(' '));

    for (var i in parseTable[0][parseTable.length - 1]) {
        document.body.innerHTML += '<div class="tree" id="displayTree"><ul>' + traverseParseTable(parseTable, 0, parseTable.length - 1, i) + '</ul></div><br/>';
    }

}