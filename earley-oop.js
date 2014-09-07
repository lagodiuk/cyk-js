function Grammar( rules ) {
    this.lhsToRhsList = {};
    for(var i in rules) {
        var rule = rules[i];
        // "A -> B C | D" -> ["A ", " B C | D"]
        var parts = rule.split('->');
        // "A"
        var lhs = parts[0].trim();;
        // "B C | D"
        var rhss = parts[1].trim();
        // "B C | D" -> ["B C", "D"]
        var rhssParts = rhss.split('|');
        if(!this.lhsToRhsList[lhs]) {
            this.lhsToRhsList[lhs] = [];
        }
        for(var j in rhssParts) {
            this.lhsToRhsList[lhs].push(rhssParts[j].trim().split(' '));
        }
        // now this.lhsToRhsList contains list of these rules:
        // {... "A": [["B C"], ["D"]] ...}
    }
}

Grammar.prototype.terminalSymbols = function( token ) {
    return [];
}

Grammar.prototype.getRightHandSides = function( leftHandSide ) {
    var rhss = this.lhsToRhsList[leftHandSide];
    if( rhss ) {
        return rhss;
    }
    return null;
}

//------------------------------------------------------------------------------------

function Chart( tokens ) {
    this.idToState = {};
    this.currentId = 0;
    
    this.chart = [];
    for(var i = 0; i < tokens.length + 1; i++) {
        this.chart[i] = [];
    }
}

Chart.prototype.addToChart = function( newState, position ) {
    newState.setId( this.currentId );
    
    // TODO: use HashSet + LinkedList
    var chartColumn = this.chart[position];
    for(var x in chartColumn) {
        var chartState = chartColumn[x];
        if( newState.equals(chartState) ) {
            chartState.appendRefsToChidStates( newState.getRefsToChidStates() );
            return;
        }
    }        
    
    chartColumn.push(newState);
    this.idToState[ this.currentId ] = newState;
    this.currentId++;
}

Chart.prototype.getStatesInColumn = function( index ) {
    return this.chart[index];
}

Chart.prototype.countStatesInColumn = function( index ) {
    return this.chart[index].length;
}

Chart.prototype.log = function( column ) {
    console.log('-------------------')
    console.log( 'Column: ' + column )
    console.log('-------------------')
    for(var j in this.chart[column]) {
        console.log(this.chart[column][j].toString())
    }
}

//------------------------------------------------------------------------------------

function State( lhs, rhs, dot, left, right ) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.dot = dot;
    this.left = left;
    this.right = right;
    this.id = -1;
    this.ref = [];
}

State.prototype.complete = function() {
    return this.dot >= this.rhs.length;
}

State.prototype.toString = function() {    
    var builder = [];
    
    builder.push('(id: ' + this.id + ')');
    
    builder.push( this.lhs );
    builder.push('→');
    for(var i = 0; i < this.rhs.length; i++) {
        if( i == this.dot ) {
            builder.push('•');
        }
        builder.push( this.rhs[i] );
    }
    if( this.complete() ) {
        builder.push('•');
    }
    
    builder.push('[' + this.left + ', ' + this.right + ']');
    
    builder.push(JSON.stringify(this.ref))
    
    return builder.join(' ');
}

State.prototype.expectedNonTerminal = function( grammar ) {
    var expected = this.rhs[ this.dot ];
    var rhss = grammar.getRightHandSides( expected );
    if(rhss !== null) {
        return true;
    }
    return false;
}

State.prototype.setId = function( id ) {
    this.id = id;
}

State.prototype.getId = function() {
    return this.id;
}

State.prototype.equals = function( otherState ) {
    if( this.lhs === otherState.lhs
      && this.dot === otherState.dot 
      && this.left === otherState.left
      && this.right === otherState.right
      && JSON.stringify(this.rhs) === JSON.stringify(otherState.rhs) ) {
        return true;
    }
    return false;
}

State.prototype.getRefsToChidStates = function() {
    return this.ref;
}

State.prototype.appendRefsToChidStates = function( refs ) {
    this.ref = this.ref.concat( refs );
}

State.prototype.predictor = function( grammar, chart ) {
    var nonTerm = this.rhs[ this.dot ];
    var rhss = grammar.getRightHandSides( nonTerm );
    for(var i in rhss) {
        var rhs = rhss[i];
        var newState = new State(nonTerm, rhs, 0, this.right, this.right);
        chart.addToChart(newState, this.right);
    }
}

State.prototype.scanner = function( grammar, chart, token ) {
    var term = this.rhs[ this.dot ];
    var tokenTerminals = grammar.terminalSymbols( token );
    tokenTerminals.push( token );
    for(var i in tokenTerminals) {
        if( term == tokenTerminals[i]) {
            var newState = new State(term, [token], 1, this.right, this.right + 1);
            chart.addToChart(newState, this.right + 1);
            break;
        }
    }
}

State.prototype.completer = function( chart ) {
    var statesInColumn = chart.getStatesInColumn( this.left );
    for(var i in statesInColumn) {
        var existingState = statesInColumn[i];
        if(existingState.rhs[existingState.dot] == this.lhs) {
            var newState = new State( existingState.lhs, existingState.rhs, existingState.dot + 1, existingState.left, this.right);
            newState.appendRefsToChidStates(existingState.ref);
            newState.appendRefsToChidStates([{dot: existingState.dot, id: this.id}])
            chart.addToChart(newState, this.right);
        }
    }
}

//------------------------------------------------------------------------------------

function parse( tokens, grammar, rootRule ) {
    var chart = new Chart( tokens );
    var rootRuleRhss = grammar.getRightHandSides( rootRule );
    for(var i in rootRuleRhss) {
        var rhs = rootRuleRhss[i];
        var initialState = new State(rootRule, rhs, 0, 0, 0);
        chart.addToChart(initialState, 0);
    }
    for(var i = 0; i < tokens.length + 1; i++) {
        j = 0;
        while(j < chart.countStatesInColumn(i)) {
            var state = chart.getStatesInColumn(i)[j];
            if(!state.complete()) {
                if(state.expectedNonTerminal(grammar)) {
                    state.predictor(grammar, chart);                    
                } else {
                    state.scanner(grammar, chart, tokens[i]);
                }
            } else {
                state.completer(chart);
            }
            j++;
        }
        chart.log(i)
    }
}

//------------------------------------------------------------------------------------

var grammar = new Grammar([
    'R -> S',
    'S -> S add_sub M | M | num',
    'M -> M mul_div T | T | num',
    'T -> num',
    'num -> 2 | 3 | 4',
    'add_sub -> + | -',
    'mul_div -> * | /'
]);
/*
grammar.terminalSymbols = function( token ) {
    if( '+' === token || '-' === token ) return ['add_sub'];
    if( '*' === token || '/' === token ) return ['mul_div'];
    return ['num'];    
}
*/

parse('2 + 3 * 4'.split(' '), grammar, 'R');
