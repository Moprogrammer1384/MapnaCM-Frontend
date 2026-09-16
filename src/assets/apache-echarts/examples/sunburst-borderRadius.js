/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Sunburst with Rounded Corner
category: sunburst
titleCN: 圆角旭日图
difficulty: 2
*/
var data = [
    {
        name: 'Grandpa',
        children: [
            {
                name: 'Uncle Leo',
                value: 15,
                children: [
                    {
                        name: 'Cousin Jack',
                        value: 2
                    },
                    {
                        name: 'Cousin Mary',
                        value: 5,
                        children: [
                            {
                                name: 'Jackson',
                                value: 2
                            }
                        ]
                    },
                    {
                        name: 'Cousin Ben',
                        value: 4
                    }
                ]
            },
            {
                name: 'Father',
                value: 10,
                children: [
                    {
                        name: 'Me',
                        value: 5
                    },
                    {
                        name: 'Brother Peter',
                        value: 1
                    }
                ]
            }
        ]
    },
    {
        name: 'Nancy',
        children: [
            {
                name: 'Uncle Nike',
                children: [
                    {
                        name: 'Cousin Betty',
                        value: 1
                    },
                    {
                        name: 'Cousin Jenny',
                        value: 2
                    }
                ]
            }
        ]
    }
];
option = {
    series: {
        type: 'sunburst',
        data: data,
        radius: [60, '90%'],
        itemStyle: {
            borderRadius: 7,
            borderWidth: 2
        },
        label: {
            show: false
        }
    }
};
