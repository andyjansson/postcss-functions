import valueParser from 'postcss-value-parser';

export default functions => {

    function transformValue(value) {
        const promises = [];

        const values = valueParser(value).walk(node => {
            promises.push(transform(node));
        });

        return Promise.all(promises).then(() => {
            return values.toString();  
        });
    }

    function transform(node) {
        if (node.type !== 'function' || !functions.hasOwnProperty(node.value))
            return;

        const func = functions[node.value];
        return extractArguments(node.nodes).then(args => {
            const invocation = func.apply(func, args);

            const replaceValue = val => {
                node.type = 'word';
                node.value = val;

                return node;
            };

            if (invocation instanceof Promise)
                return invocation.then(replaceValue);
            else 
                return replaceValue(invocation);
        });
    }

    function extractArguments(nodes) {
        const args = nodes.filter(node => node.type !== 'div').map(node => {
            return node.type === 'function' ? transform(node) : node; 
        });

        return Promise.all(args).then(values => {
            return values.map(value => valueParser.stringify(value));
        });
    }

    return node => {
        switch (node.type) {
            case 'decl':
                return transformValue(node.value).then(value => {
                    node.value = value;
                });
            case 'atrule':
                return transformValue(node.params).then(value => {
                    node.params = value;
                });
            case 'rule':
                return transformValue(node.selector).then(value => {
                    node.selector = value;
                });
        }
    };
};
