var matchers = [
    ['word', /^[A-z\-]+/],
    ['parenthesisOpen', /^\(/],
    ['parenthesisClose', /^\)/],
    ['comma', /^,/],
    ['string', /^"[^"]+"|^'[^"]+'/]
]

module.exports = function(sequelize, key, functionString){
    var lastNode;

    while(functionString.length){
        var nextToken = null;
        for(var i = 0; i < matchers.length; i++){
            var match = functionString.match(matchers[i][1]);

            if(match){
                nextToken = {
                    type: matchers[i][0],
                    source: match[0]
                }
                functionString = functionString.slice(match[0].length);
                break;
            }
        }

        if(!nextToken){
            throw 'Could not parse next token in expression: ' + functionString;
        }

        if(!lastNode){
            lastNode = nextToken;
            continue;
        }

        if(nextToken.type === 'parenthesisOpen'){
            if(lastNode.type === 'word'){
                var parent = lastNode.parent;
                var childNode = {
                    type: 'functionInvocation',
                    identifier: lastNode,
                    arguments: [],
                    parent: parent
                };
                if(parent && parent.arguments){
                    var index = parent.arguments.indexOf(lastNode);
                    parent.arguments.splice(index, 1, childNode);
                }
                lastNode = childNode;
            }
            continue;
        }

        if(nextToken.type === 'word'){
            if(lastNode.type === 'functionInvocation'){
                nextToken.parent = lastNode;
                lastNode.arguments.push(nextToken);
                lastNode = nextToken;
                continue;
            }
        }

        if(nextToken.type === 'string'){
            if(lastNode.type === 'functionInvocation'){
                nextToken.parent = lastNode;
                lastNode.arguments.push(nextToken);
                lastNode = nextToken;
                continue;
            }
        }

        if(nextToken.type === 'comma'){
            lastNode = lastNode.parent;
            continue;
        }

        if(nextToken.type === 'parenthesisClose'){
            lastNode = lastNode.parent;
            if(lastNode.type !== 'functionInvocation'){
                throw 'Could not parse next token in expression: ' + nextToken.source;
            }
            continue;
        }
    }

    if(lastNode.type !== 'functionInvocation'){
        throw 'Invalid expression';
    }

    function processNode(node){
        if(node.type === 'string'){
            return node.source.slice(1, -1);
        }

        var functionName = node.identifier.source,
            sequelizeFunction = sequelize[functionName];

        if(!(functionName in sequelize)){
            sequelizeFunction = sequelize.fn.bind(sequelize, functionName);
        }

        return sequelizeFunction.apply(null, node.arguments.map(processNode));
    }

    return processNode(lastNode);
};