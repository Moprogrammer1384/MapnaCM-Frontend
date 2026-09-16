/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Graph on Cartesian
category: graph
titleCN: 笛卡尔坐标系上的 Graph
difficulty: 2
*/
const axisData = ['Mon', 'Tue', 'Wed', 'Very Loooong Thu', 'Fri', 'Sat', 'Sun'];
const data = axisData.map(function (item, i) {
    return Math.round(Math.random() * 1000 * (i + 1));
});
const links = data.map(function (item, i) {
    return {
        source: i,
        target: i + 1
    };
});
links.pop();
option = {
    title: {
        text: 'Graph on Cartesian'
    },
    tooltip: {},
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: axisData
    },
    yAxis: {
        type: 'value'
    },
    series: [
        {
            type: 'graph',
            layout: 'none',
            coordinateSystem: 'cartesian2d',
            symbolSize: 40,
            label: {
                show: true
            },
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            data: data,
            links: links,
            lineStyle: {
                color: '#2f4554'
            }
        }
    ]
};
