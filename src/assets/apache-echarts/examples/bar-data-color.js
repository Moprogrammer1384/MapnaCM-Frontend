/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Set Style of Single Bar.
category: bar
titleCN: 自定义单个柱子颜色
difficulty: 1
*/
option = {
    xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
        type: 'value'
    },
    series: [
        {
            data: [
                120,
                {
                    value: 200,
                    itemStyle: {
                        color: '#505372'
                    }
                },
                150,
                80,
                70,
                110,
                130
            ],
            type: 'bar'
        }
    ]
};
