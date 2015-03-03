
tags
    = head:tag tail:( " "+ tag )* {
        if (tail.length) {
            var children = [head];
            for (var index = 0; index < tail.length; index++) {
                children.push(tail[index][1]);
            }
            return {
                type: "options",
                options: children
            };
        } else {
            return head;
        }
    }

tag
    = _ pattern:pattern tree:tree plural:"*"? {
        tree.pattern = pattern;
        if (plural) {
            return {
                type: "multiple",
                of: tree
            }
        }
        return tree;
    }

pattern
    = name:name {
        return {
            type: "name",
            name: name
        }
    }
    / "" {
        return {
            type: "any"
        }
    }

tree
    = "[" _ type:$( "body" / "text" / "html" / "entries" ) _ "]" {
        return {
            type: type,
            pattern: null
        }
    }
    / "(" _ tags:tags _ ")" {
        return {
            type: "children",
            pattern: null,
            children: tags
        };
    }
    / "" {
        return {
            type: "body",
            pattern: null
        };
    }

name
    = name:$([a-zA-Z_0-9-]+) {
        return name;
    }

_
    = " "*

