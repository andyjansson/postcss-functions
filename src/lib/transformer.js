import valueParser from 'postcss-value-parser';

import {hasPromises,then} from './helpers';

export default (functions, withNode) => {

    function transformValue(node, prop) {
        let promises = [];

        const values = valueParser(node[prop]).walk(part => {
            promises.push(transform(part, withNode, node));
        });

        if (hasPromises(promises))
            promises = Promise.all(promises);

        return then(promises, () => {
            node[prop] = values.toString();  
        });
    }

    function transform(node, withNode, cssNode) {
        if (node.type !== 'function' || !functions.hasOwnProperty(node.value))
            return node;

        const func = functions[node.value];
        return then(extractArguments(node.nodes, withNode, cssNode), args => {
            if (withNode[node.value]) {
                args = [cssNode,...args]
            }
            const invocation = func.apply(func, args);

            return then(invocation, val => {
                node.type = 'word';
                node.value = val;
                return node;
            });
        });
    }

    function extractArguments(nodes, withNode, cssNode) {
        nodes = nodes.map(node => transform(node, withNode, cssNode));

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

    return node => {
        switch (node.type) {
            case 'decl':
                return transformValue(node, 'value');
            case 'atrule':
                return transformValue(node, 'params');
            case 'rule':
                return transformValue(node, 'selector');
        }
    };
};
