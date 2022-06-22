import DataSet from '@antv/data-set';
import { Chart, Coord, Geom, Shape, Tooltip } from 'bizcharts';
import classNames from 'classnames';
import Debounce from 'lodash.debounce';
import { Component } from 'react';
import autoHeight from '../autoHeight';
import styles from './index.less';
/* eslint no-underscore-dangle: 0 */

/* eslint no-param-reassign: 0 */

const imgUrl = 'https://gw.alipayobjects.com/zos/rmsportal/gWyeGLCdFFRavBGIDzWk.png';

class TagCloud extends Component {
  state = {
    dv: null,
    height: 0,
    width: 0,
  };
  isUnmount = false;
  requestRef = 0;
  root = undefined;
  imageMask = undefined;

  componentDidMount() {
    requestAnimationFrame(() => {
      this.initTagCloud();
      this.renderChart(this.props);
    });
    window.addEventListener('resize', this.resize, {
      passive: true,
    });
  }

  componentDidUpdate(preProps) {
    const { data } = this.props;

    if (preProps && JSON.stringify(preProps.data) !== JSON.stringify(data)) {
      this.renderChart(this.props);
    }
  }

  componentWillUnmount() {
    this.isUnmount = true;
    window.cancelAnimationFrame(this.requestRef);
    window.removeEventListener('resize', this.resize);
  }

  resize = () => {
    this.requestRef = requestAnimationFrame(() => {
      this.renderChart(this.props);
    });
  };
  saveRootRef = (node) => {
    this.root = node;
  };
  initTagCloud = () => {
    function getTextAttrs(cfg) {
      return {
        ...cfg.style,
        fillOpacity: cfg.opacity,
        fontSize: cfg.origin._origin.size,
        rotate: cfg.origin._origin.rotate,
        text: cfg.origin._origin.text,
        textAlign: 'center',
        fontFamily: cfg.origin._origin.font,
        fill: cfg.color,
        textBaseline: 'Alphabetic',
      };
    }

    Shape.registerShape('point', 'cloud', {
      drawShape(cfg, container) {
        const attrs = getTextAttrs(cfg);
        return container.addShape('text', {
          attrs: { ...attrs, x: cfg.x, y: cfg.y },
        });
      },
    });
  };
  renderChart = Debounce((nextProps) => {
    // const colors = ['#1890FF', '#41D9C7', '#2FC25B', '#FACC14', '#9AE65C'];
    const { data, height } = nextProps || this.props;

    if (data.length < 1 || !this.root) {
      return;
    }

    const h = height;
    const w = this.root.offsetWidth;

    const onload = () => {
      const dv = new DataSet.View().source(data);
      const range = dv.range('value');
      const [min, max] = range;
      dv.transform({
        type: 'tag-cloud',
        fields: ['name', 'value'],
        imageMask: this.imageMask,
        font: 'Verdana',
        size: [w, h],
        // 宽高设置最好根据 imageMask 做调整
        padding: 0,
        timeInterval: 5000,

        // max execute time
        rotate() {
          return 0;
        },

        fontSize(d) {
          const size = ((d.value - min) / (max - min)) ** 2;
          return size * (17.5 - 5) + 5;
        },
      });

      if (this.isUnmount) {
        return;
      }

      this.setState({
        dv,
        width: w,
        height: h,
      });
    };

    if (!this.imageMask) {
      this.imageMask = new Image();
      this.imageMask.crossOrigin = '';
      this.imageMask.src = imgUrl;
      this.imageMask.onload = onload;
    } else {
      onload();
    }
  }, 500);

  render() {
    const { className, height } = this.props;
    const { dv, width, height: stateHeight } = this.state;
    return (
      <div
        className={classNames(styles.tagCloud, className)}
        style={{
          width: '100%',
          height,
        }}
        ref={this.saveRootRef}
      >
        {dv && (
          <Chart
            width={width}
            height={stateHeight}
            data={dv}
            padding={0}
            scale={{
              x: {
                nice: false,
              },
              y: {
                nice: false,
              },
            }}
          >
            <Tooltip showTitle={false} />
            <Coord reflect="y" />
            <Geom
              type="point"
              position="x*y"
              color="text"
              shape="cloud"
              tooltip={[
                'text*value',
                function trans(text, value) {
                  return {
                    name: text,
                    value,
                  };
                },
              ]}
            />
          </Chart>
        )}
      </div>
    );
  }
}

export default autoHeight()(TagCloud);
