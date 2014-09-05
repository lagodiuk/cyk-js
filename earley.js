function parse( words, grammar ) {
    var idToStateMap = {};
    var chart = [];
    var id = 0;
    for(var i = 0; i < words.length + 1; i++) {
        chart[i] = [];
    }
    
    function incomplete( state ) {
        return state['dot'] < state['rhs'].length;
    }
    
    function expectedNonTerminal( state, grammar ) {
        var expected = state['rhs'][state['dot']];
        if( grammar[expected] ) {
            return true;
        }
        return false;
    }
    
    function addToChart( newState, position ) {
        if(!newState['ref']) {
            newState['ref'] = [];
        }
        newState['id'] = id;        
        
        for(var x in chart[position]) {
            var chartState = chart[position][x];
            if(chartState['lhs'] == newState['lhs']
              && chartState['dot'] == newState['dot']
              && chartState['pos'] == newState['pos']
              && JSON.stringify(chartState['rhs']) == JSON.stringify(newState['rhs'])) {
                chartState['ref'] = (chartState['ref'].slice()).concat(newState['ref']);
                return;
            }
        }        
        
        chart[position].push(newState);
        idToStateMap[id] = newState;
        
        id++;
    }
    
    function predictor( state, j, grammar ) {
        var nonTerm = state['rhs'][state['dot']];
        var productions = grammar[nonTerm];
        for(var i in productions) {
            var newState = {
                'lhs': nonTerm,
                'rhs': productions[i],
                'dot': 0,
                'pos': j
            };
            addToChart(newState, j);
        }
    }
    
    function scanner( state, j, grammar ) {
        var term = state['rhs'][state['dot']];
        var termPOS = grammar.partOfSpeech( words[j] );
        termPOS.push( words[j] );
        for(var i in termPOS) {
            if(term == termPOS[i]) {
                var newState = {
                    'lhs': term,
                    'rhs': [words[j]],
                    'dot': 1,
                    'pos': j
                };
                addToChart(newState, j + 1);
                break;
            }
        }
    }
    
    function completer( state, k ) {
        var parentChart = chart[state['pos']];
        for(var i in parentChart) {
            var stateI = parentChart[i];
            if(stateI['rhs'][stateI['dot']] == state['lhs']) {
                var newState = {
                    'lhs': stateI['lhs'],
                    'rhs': stateI['rhs'],
                    'dot': stateI['dot'] + 1,
                    'pos': stateI['pos'],
                    'ref': stateI['ref'].slice()
                };
                newState['ref'].push({
                    'dot': stateI['dot'],
                    'ref': state['id']
                });
                addToChart(newState, k);
            }
        }
    }
    
    function log( message, chart ) {
        console.log(message);
        for(var o in chart) {
            console.log(JSON.stringify(chart[o])); 
        }
        console.log();
    }

    var initialState = {
        'lhs': 'R',
        'rhs': ['S'],
        'dot': 0,
        'pos': 0
    };
    addToChart(initialState, 0);
    log('init', chart);
    for(var i = 0; i < words.length + 1; i++) {
        j = 0;
        while( j < chart[i].length) {
            var state = chart[i][j];
            if( incomplete(state) ) { 
                if( expectedNonTerminal(state, grammar) ) {                                                            
                    predictor(state, i, grammar);                
                    log('predictor',chart);                
                } else {
                    scanner(state, i, grammar);
                    log('scanner',chart);                
                }
            } else {
                completer(state, i);            
                log('completer',chart);            
            }
            j++;
        }
    }
    
    log('done', chart);
    console.log('');
    for(var id in idToStateMap) {
        console.log(id + '\t' + JSON.stringify(idToStateMap[id], null, 0));    
    }
}


function processGrammar( grammar ) {
    var processed = {};
    for(var i in grammar) {
        var rule = grammar[i];
        var parts = rule.split('->');
        var lhs = parts[0].trim();;
        var rhs = parts[1].trim();
        if(!processed[lhs]) {
            processed[lhs] = [];
        }
        var rhsParts = rhs.split('|');
        for(var j in rhsParts) {
            processed[lhs].push(rhsParts[j].trim().split(' '));
        }
    }
    processed.partOfSpeech = function( word ) {
        return [];
    }
    return processed;
}

/*
var grammar = {
    'R': [['S']],
    'S': [['S', 'add_sub', 'M'], ['M'], ['num']],
    'M': [['M', 'mul_div', 'T'], ['T'], ['num']],
    'T': [['num']]
};
grammar.partOfSpeech = function( word ) {
    if( '+' == word || '-' == word ) return ['add_sub'];
    if( '*' == word || '/' == word ) return ['mul_div'];
    return ['num'];
}
*/

//parse('2 + 3 + 4'.split(' '), grammar);
var grammar = [
    'R -> S',
    'S -> S add_sub M | M | num',
    'M -> M mul_div T | T | num',
    'T -> num',
    'num -> 2 | 3 | 4',
    'add_sub -> + | -',
    'mul_div -> * | /'
];
parse('2 + 3 * 4'.split(' '), processGrammar(grammar));
//alert(JSON.stringify(processGrammar(grammar), null, 4))
