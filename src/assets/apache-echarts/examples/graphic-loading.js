/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Customized Loading Animation
category: graphic
titleCN: 加载动画
difficulty: 6
videoStart: 1000
videoEnd: 3200
shotWidth: 400
*/
option = {
    graphic: {
        elements: [
            {
                type: 'group',
                left: 'center',
                top: 'center',
                children: new Array(7).fill(0).map((val, i) => ({
                    type: 'rect',
                    x: i * 20,
                    shape: {
                        x: 0,
                        y: -40,
                        width: 10,
                        height: 80
                    },
                    style: {
                        fill: '#5470c6'
                    },
                    keyframeAnimation: {
                        duration: 1000,
                        delay: i * 200,
                        loop: true,
                        keyframes: [
                            {
                                percent: 0.5,
                                scaleY: 0.3,
                                easing: 'cubicIn'
                            },
                            {
                                percent: 1,
                                scaleY: 1,
                                easing: 'cubicOut'
                            }
                        ]
                    }
                }))
            }
        ]
    }
};
