/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Area Pieces
titleCN: 折线图区域高亮
category: 'line, visualMap'
difficulty: 3
*/
option = {
    xAxis: {
        type: 'category',
        boundaryGap: false
    },
    yAxis: {
        type: 'value',
        boundaryGap: [0, '30%']
    },
    visualMap: {
        type: 'piecewise',
        show: false,
        dimension: 0,
        seriesIndex: 0,
        pieces: [
            {
                gt: 1,
                lt: 3,
                color: 'rgba(0, 0, 180, 0.4)'
            },
            {
                gt: 5,
                lt: 7,
                color: 'rgba(0, 0, 180, 0.4)'
            }
        ]
    },
    series: [
        {
            type: 'line',
            smooth: 0.6,
            symbol: 'none',
            lineStyle: {
                color: '#5470C6',
                width: 5
            },
            markLine: {
                symbol: ['none', 'none'],
                label: { show: false },
                data: [{ xAxis: 1 }, { xAxis: 3 }, { xAxis: 5 }, { xAxis: 7 }]
            },
            areaStyle: {},
            data: [
                ['2019-10-10', 200],
                ['2019-10-11', 560],
                ['2019-10-12', 750],
                ['2019-10-13', 580],
                ['2019-10-14', 250],
                ['2019-10-15', 300],
                ['2019-10-16', 450],
                ['2019-10-17', 300],
                ['2019-10-18', 100]
            ]
        }
    ]
};
