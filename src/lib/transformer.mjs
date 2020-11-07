import valueParser from 'postcss-value-parser';

import { hasPromises, then } from './helpers.mjs';

function transformString(str, functions) {
    let promises = [];

    const values = valueParser(str).walk(part => {
        promises.push(transformNode(part, functions));
    });
    
    if (hasPromises(promises))
        promises = Promise.all(promises);

    return then(promises, () => {
        return values.toString();
    });
}

function transformNode(node, functions) {
    if (node.type !== 'function' || !Object.prototype.hasOwnProperty.call(functions, node.value))
        return node;

    const func = functions[node.value];
    return then(extractArgs(node.nodes, functions), args => {
        const invocation = func.apply(func, args);

        return then(invocation, val => {
            node.type = 'word';
            node.value = val;
            return node;
        });
    });
}

function extractArgs(nodes, functions) {
    nodes = nodes.map(node => transformNode(node, functions));

    if (hasPromises(nodes))
        nodes = Promise.all(nodes);

    return then(nodes, values => {
        const args = [];
        const last = values.reduce((prev, node) => {
            if (node.type === 'div' && node.value === ',') {
                args.push(prev);
                return '';
            }
            return prev + valueParser.stringify(node);
        }, '');

        if (last)
            args.push(last);

        return args;
    });
}

export function transformDecl(node, functions) {
    return then(transformString(node.value, functions), value => {
        node.value = value;
    });
}

export function transformAtRule(node, functions) {
    return then(transformString(node.params, functions), value => {
        node.params = value;
    });
}

export function transformRule(node, functions) {
    return then(transformString(node.selector, functions), value => {
        node.selector = value;
    });
}
