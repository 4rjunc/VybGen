import * as fs from 'fs';
import { createCanvas } from 'canvas';
import * as d3 from 'd3';

// The OHLCV data
const ohlcvData = {
  "data": [
    {
      "time": 1744070400,
      "open": "0.006563761745284714",
      "high": "0.007179296549942463",
      "low": "0.006034867359092077",
      "close": "0.006397232509705602",
      "volume": "2943487.809030545016486165",
      "volumeUsd": "18830.175903852317238480806311460655996330",
      "count": 393
    },
    {
      "time": 1744156800,
      "open": "0.006408206977752359",
      "high": "0.008227564292730650",
      "low": "0.005978189683988801",
      "close": "0.007792078495084052",
      "volume": "4168165.846229587024669467",
      "volumeUsd": "32478.675454349384563365277542409683040284",
      "count": 398
    },
    {
      "time": 1744243200,
      "open": "0.007771675455097031",
      "high": "0.007771675455097031",
      "low": "0.006648847783446821",
      "close": "0.007282666855477453",
      "volume": "1948188.886812204961409942",
      "volumeUsd": "14188.010634196760310501886366312471037726",
      "count": 360
    },
    {
      "time": 1744329600,
      "open": "0.006985233852225498",
      "high": "0.010064361786282478",
      "low": "0.006114367424501462",
      "close": "0.009363050873979802",
      "volume": "14201844.221156374069602018",
      "volumeUsd": "132972.589947023188673479195023605910440436",
      "count": 2573
    },
    {
      "time": 1744416000,
      "open": "0.009530245060646664",
      "high": "0.011124507414872554",
      "low": "0.008846863897831427",
      "close": "0.010896759552707564",
      "volume": "3577825.572721095997400993",
      "volumeUsd": "38986.704987470014015125067215340172211052",
      "count": 495
    },
    {
      "time": 1744502400,
      "open": "0.010854267310453648",
      "high": "0.010939112250538406",
      "low": "0.008537777645110455",
      "close": "0.008736669887841211",
      "volume": "3654981.248235814009523074",
      "volumeUsd": "31932.364612086118562742669186237552602614",
      "count": 470
    },
    {
      "time": 1744588800,
      "open": "0.008973319481344036",
      "high": "0.009690680862565192",
      "low": "0.008847401974290719",
      "close": "0.009574025759376918",
      "volume": "2970434.202070945068535484",
      "volumeUsd": "28439.013567161449350208920694874613558312",
      "count": 397
    },
    {
      "time": 1744675200,
      "open": "0.009584352156450450",
      "high": "0.010047295852021726",
      "low": "0.008977290466513176",
      "close": "0.009266993628550252",
      "volume": "3751332.648104792033786259",
      "volumeUsd": "34763.575748559652345647380893132608587268",
      "count": 409
    },
    {
      "time": 1744761600,
      "open": "0.009652571040760094",
      "high": "0.012133162406542920",
      "low": "0.009622196439952706",
      "close": "0.011456697584027686",
      "volume": "12874862.300497406995463662",
      "volumeUsd": "147503.403812797778160844806605269014946132",
      "count": 1236
    },
    {
      "time": 1744848000,
      "open": "0.011609324669351614",
      "high": "0.016566948392151490",
      "low": "0.011571593805246934",
      "close": "0.016126981084322190",
      "volume": "27820602.045731873131875946",
      "volumeUsd": "448662.322945973140706765570780964575041740",
      "count": 4615
    },
    {
      "time": 1744934400,
      "open": "0.016195467503605468",
      "high": "0.016566948392151490",
      "low": "0.013284660641172088",
      "close": "0.013473175750576328",
      "volume": "10040230.385495558974174874",
      "volumeUsd": "135273.788560058382801159673148573756782672",
      "count": 2711
    },
    {
      "time": 1745020800,
      "open": "0.013558256910408082",
      "high": "0.014725627530929818",
      "low": "0.013387344808902780",
      "close": "0.014321259826068700",
      "volume": "3744989.106900497961595151",
      "volumeUsd": "53632.962045719001588431591102665312873700",
      "count": 925
    },
    {
      "time": 1745107200,
      "open": "0.014324460743948290",
      "high": "0.014999587084078994",
      "low": "0.012827757150974394",
      "close": "0.013089293350007136",
      "volume": "3625210.699596834042692508",
      "volumeUsd": "47451.446302607557019620984066950453737088",
      "count": 1322
    },
    {
      "time": 1745193600,
      "open": "0.013094785618724894",
      "high": "0.014037233878727568",
      "low": "0.012475831240665896",
      "close": "0.013609383292732516",
      "volume": "4459982.883915188973430789",
      "volumeUsd": "60697.616546228357182225630301039015835124",
      "count": 1258
    },
    {
      "time": 1745280000,
      "open": "0.013579502905806326",
      "high": "0.014996644425815484",
      "low": "0.013439730146110166",
      "close": "0.014645091421084386",
      "volume": "3965622.912549783033715544",
      "volumeUsd": "58076.910095838503797577293179831143895984",
      "count": 1110
    }
  ]
};

// Define color scheme for dark mode
const darkModeColors = {
  background: '#121212',
  text: '#e0e0e0',
  grid: '#333333',
  axis: '#555555',
  upCandle: '#26a69a', // Teal green for up days
  downCandle: '#ef5350', // Light red for down days
  wickColor: '#888888'
};

// Format data for charting with proper date formatting
const formatData = () => {
  return ohlcvData.data.map(item => {
    const date = new Date(item.time * 1000);

    // Format date as MM/DD/YY
    const formattedDate = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });

    return {
      date: formattedDate,
      timestamp: item.time * 1000, // Store timestamp for sorting if needed
      open: parseFloat(item.open),
      high: parseFloat(item.high) > 1 ? parseFloat(item.open) * 1.1 : parseFloat(item.high), // Fix anomalous data
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume),
      volumeUsd: parseFloat(item.volumeUsd)
    };
  });
};

// Generate the chart image with dark mode
const generateChartImage = () => {
  const width = 1200;
  const height = 800;
  const margin = { top: 60, right: 60, bottom: 80, left: 90 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set dark background
  ctx.fillStyle = darkModeColors.background;
  ctx.fillRect(0, 0, width, height);

  // Format data
  const data = formatData();

  // Set up scales
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.date))
    .range([0, chartWidth])
    .padding(0.2);

  const minPrice = d3.min(data, d => d.low) || 0;
  const maxPrice = d3.max(data, d => d.high) || 0;
  const pricePadding = (maxPrice - minPrice) * 0.1; // Add 10% buffer

  const yScale = d3.scaleLinear()
    .domain([minPrice - pricePadding, maxPrice + pricePadding])
    .range([chartHeight, 0]);

  // Draw grid lines
  ctx.strokeStyle = darkModeColors.grid;
  ctx.lineWidth = 0.5;

  // Horizontal grid lines
  const yTicks = yScale.ticks(10);
  yTicks.forEach(tick => {
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + yScale(tick));
    ctx.lineTo(width - margin.right, margin.top + yScale(tick));
    ctx.stroke();
  });

  // Vertical grid lines
  data.forEach((d, i) => {
    if (i % 2 === 0) { // Draw every second line to avoid overcrowding
      const x = margin.left + xScale(d.date) + xScale.bandwidth() / 2;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }
  });

  // Draw axes
  ctx.strokeStyle = darkModeColors.axis;
  ctx.lineWidth = 1.5;

  // X axis
  ctx.beginPath();
  ctx.moveTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  // Y axis
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.stroke();

  // X axis labels
  ctx.fillStyle = darkModeColors.text;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  data.forEach((d, i) => {
    if (i % 2 === 0 || i === data.length - 1) { // Show every second label to avoid overcrowding
      const x = margin.left + xScale(d.date) + xScale.bandwidth() / 2;
      ctx.fillText(d.date, x, height - margin.bottom + 25);
    }
  });

  // Y axis labels
  ctx.textAlign = 'right';
  yTicks.forEach(tick => {
    ctx.fillText('$' + tick.toFixed(5), margin.left - 10, margin.top + yScale(tick) + 4);
  });

  // Draw candlesticks
  data.forEach(d => {
    const x = margin.left + xScale(d.date) + xScale.bandwidth() / 2;
    const open = margin.top + yScale(d.open);
    const close = margin.top + yScale(d.close);
    const high = margin.top + yScale(d.high);
    const low = margin.top + yScale(d.low);

    // Draw the wick (the line connecting the highest and lowest prices)
    ctx.strokeStyle = darkModeColors.wickColor;
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.stroke();

    // Draw the body (the rectangular part between open and close)
    const bodyWidth = xScale.bandwidth() * 0.8;
    const bodyHeight = Math.abs(close - open);
    const bodyX = x - bodyWidth / 2;
    const bodyY = Math.min(open, close);

    // Fill green if close > open (price up), red if close < open (price down)
    ctx.fillStyle = d.close > d.open ? darkModeColors.upCandle : darkModeColors.downCandle;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.strokeStyle = darkModeColors.wickColor;
    ctx.strokeRect(bodyX, bodyY, bodyWidth, bodyHeight);
  });

  // Draw chart title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = darkModeColors.text;
  ctx.textAlign = 'center';
  ctx.fillText('Token OHLCV Chart', width / 2, 30);

  // Add price range info
  ctx.font = '14px Arial';
  ctx.fillText(`Price Range: $${minPrice.toFixed(6)} - $${maxPrice.toFixed(6)}`, width / 2, height - 20);

  // Add time period
  const startDate = new Date(data[0].timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const endDate = new Date(data[data.length - 1].timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  ctx.fillText(`Period: ${startDate} - ${endDate}`, width / 2, 55);

  // Add legend
  const legendX = width - margin.right - 220;
  const legendY = margin.top + 20;

  ctx.fillStyle = darkModeColors.upCandle;
  ctx.fillRect(legendX, legendY, 20, 10);
  ctx.strokeRect(legendX, legendY, 20, 10);
  ctx.fillStyle = darkModeColors.text;
  ctx.textAlign = 'left';
  ctx.fillText('Up Day (Close > Open)', legendX + 30, legendY + 10);

  ctx.fillStyle = darkModeColors.downCandle;
  ctx.fillRect(legendX, legendY + 20, 20, 10);
  ctx.strokeRect(legendX, legendY + 20, 20, 10);
  ctx.fillStyle = darkModeColors.text;
  ctx.fillText('Down Day (Close < Open)', legendX + 30, legendY + 30);

  // Save image
  const imageBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync('dark_mode_token_ohlcv_chart.png', imageBuffer);
  console.log('Dark mode chart image saved as dark_mode_token_ohlcv_chart.png');
};

// Execute the chart generation
generateChartImage();

// Export the function for potential reuse
export { generateChartImage };
