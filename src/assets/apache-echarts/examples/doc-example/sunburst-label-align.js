/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
var data = [];
for (var i = 0; i < 8; ++i) {
    data.push({
        name: 'left',
        label: {
            align: 'left',
            position: 'inside'
        },
        children: [{
            name: 'right',
            value: 1,
            label: {
                align: 'right',
                position: 'inside'
            }
        }]
    });
}

option = {
    series: {
        radius: ['20%', '90%'],
        type: 'sunburst',
        sort: null,
        emphasis: {
            focus: 'none'
        },
        data: data,
        label: {
            fontSize: 14
        }
    }
};
