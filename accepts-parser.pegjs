
tags
    = head:tag tail:( " "+ tag )* {
        var options = {};
        options[head.name] = head;
        for (var index = 0; index < tail.length; index++) {
            var node = tail[index][1];
            options[node.name] = node;
        }
        return {
            type: "options",
            options: options
        };
    }
    / tree:tree plural:"*"? {
        if (plural) {
            return {
                type: "multiple",
                of: tree,
                name: tree.name
            }
        }
        return tree;
    }

tag
    = _ name:name as:(":" name)? tree:tree plural:"*"? {
        tree.name = name;
        if (plural) {
            tree = {
                type: "multiple",
                of: tree,
                name: tree.name
            }
        }
        if (as) {
            tree.as = as[1];
        }
        return tree;
    }

tree
    = "[" _ type:$( "body" / "text" / "html" / "entries" ) _ "]" {
        return {
            type: type,
            name: null
        }
    }
    / "(" _ tags:tags _ ")" {
        return {
            type: "children",
            name: null,
            children: tags
        };
    }
    / "" {
        return {
            type: "body",
            name: null
        };
    }

name
    = name:$([a-zA-Z_0-9-]+) {
        return name;
    }

_
    = " "*

