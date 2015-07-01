
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
    / tree:tree {
        return tree;
    }

tag
    = _ name:name as:(":" name)? tree:tree plural:"*"? {
        tree.name = name;
        if (plural) {
            tree.plural = plural;
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
        return tags;
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

