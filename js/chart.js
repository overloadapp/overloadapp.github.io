export function drawSmoothLineChart(canvasId, dataPoints) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size (css pixels)
    const displayWidth = canvas.clientWidth || 600;
    const displayHeight = displayWidth * 0.5; // 2:1 aspect ratio
    
    // Set actual canvas size (scaled for device pixel ratio)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    const width = displayWidth;
    const height = displayHeight;
    
    ctx.clearRect(0, 0, width, height);
    if (!dataPoints || dataPoints.length === 0) {
        ctx.fillStyle = '#718096';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
    }

    // Sort by date just in case
    dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

    const padding = 50;
    const maxWeight = Math.max(...dataPoints.map(d => d.weight));
    const minWeight = Math.min(...dataPoints.map(d => d.weight));
    const yRange = (maxWeight - minWeight) || 10; 
    
    const scaleX = (width - padding * 2) / Math.max(1, (dataPoints.length - 1));
    const scaleY = (height - padding * 2) / yRange;

    // Draw Grid and Y-Axis labels (dark theme)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '12px Inter';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
        const yValue = minWeight + (yRange / 4) * i;
        const yPos = height - padding - ((yValue - minWeight) * scaleY);
        
        ctx.beginPath();
        ctx.moveTo(padding, yPos);
        ctx.lineTo(width - padding, yPos);
        ctx.stroke();
        
        ctx.fillText(yValue.toFixed(1) + ' kg', padding - 10, yPos + 4);
    }

    // Draw gradient for line
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    // Draw area fill
    ctx.beginPath();
    const firstX = padding;
    const firstY = height - padding - ((dataPoints[0].weight - minWeight) * scaleY);
    ctx.moveTo(firstX, height - padding);
    ctx.lineTo(firstX, firstY);
    
    dataPoints.forEach((point, index) => {
        const xPos = padding + (index * scaleX);
        const yPos = height - padding - ((point.weight - minWeight) * scaleY);
        ctx.lineTo(xPos, yPos);
    });
    
    const lastX = padding + ((dataPoints.length - 1) * scaleX);
    ctx.lineTo(lastX, height - padding);
    ctx.closePath();
    
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    areaGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw Line
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(102, 126, 234, 0.5)';
    ctx.shadowBlur = 10;

    dataPoints.forEach((point, index) => {
        const xPos = padding + (index * scaleX);
        const yPos = height - padding - ((point.weight - minWeight) * scaleY);
        
        if (index === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Points
    dataPoints.forEach((point, index) => {
        const xPos = padding + (index * scaleX);
        const yPos = height - padding - ((point.weight - minWeight) * scaleY);
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(xPos, yPos, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.fill();
        
        // Main point
        ctx.beginPath();
        ctx.arc(xPos, yPos, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#667eea';
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.arc(xPos, yPos, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    });
}