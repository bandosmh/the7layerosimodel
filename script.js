document.addEventListener('DOMContentLoaded', () => {
    const layers = document.querySelectorAll('.layer');
    let isAnimating = false;
    const ns = 'http://www.w3.org/2000/svg';
    let svg = document.querySelector('.layers-svg');
    if (!svg) {
        console.warn('layers-svg element not found — creating one dynamically.');
        const containerEl = document.querySelector('.container') || document.body;
        svg = document.createElementNS(ns, 'svg');
        svg.classList.add('layers-svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('preserveAspectRatio', 'none');
        containerEl.appendChild(svg);
    }
    let locked = false; 
    // Define relationships (map layer number to array of related layer numbers)
    const relationships = {
        '7': ['6','5','4'],
        '6': ['7','5'],
        '5': ['6','4'],
        '4': ['5','3'],
        '3': ['4','2'],
        '2': ['3','1'],
        '1': ['2']
    };
    // Color map for layers (used to color-code traces)
    const layerColors = {
        '7': '#FF6B6B',
        '6': '#4ECDC4',
        '5': '#45B7D1',
        '4': '#96CEB4',
        '3': '#FFEEAD',
        '2': '#D4A5A5',
        '1': '#9B9B9B'
    };
    // connect all layers to a central HUB element visually
    
    // Initialize layers with proper animations
    function initializeLayers() {
        layers.forEach((layer, index) => {
            // Add animation delay based on position
            layer.style.setProperty('--index', index + 1);
            layer.classList.add('visible');

            // Navigate to detail page on single-click; Ctrl/Cmd+click will lock connections.
            layer.addEventListener('dblclick', () => {
                // keep dblclick as a fallback navigation (no-op if single-click already navigates)
                const layerNumber = layer.getAttribute('data-layer');
                if (!isAnimating) {
                    isAnimating = true;
                    layer.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        window.location.href = `./layer${layerNumber}.html`;
                    }, 200);
                }
            });

            layer.addEventListener('mouseenter', () => {
                if (!isAnimating && !locked) {
                    layer.classList.add('highlight');
                    drawConnections(layer.getAttribute('data-layer'));
                }
            });

            layer.addEventListener('mouseleave', () => {
                if (!isAnimating && !locked) {
                    layer.classList.remove('highlight');
                    clearConnections();
                }
            });
            // Add light effect
            layer.addEventListener('mousemove', (e) => {
                const rect = layer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                layer.style.setProperty('--mouse-x', `${x}px`);
                layer.style.setProperty('--mouse-y', `${y}px`);
            });
            
            
            layer.addEventListener('click', (e) => {
                const layerNumber = layer.getAttribute('data-layer');

                // If the click came from within the details pane (close button, links), ignore navigation/locking
                const details = layer.querySelector('.layer-details');
                if (details && details.contains(e.target)) return;

                // If Ctrl/Cmd is pressed, use the click to toggle locking (preserve previous behavior)
                if (e.ctrlKey || e.metaKey) {
                    if (locked && svg.getAttribute('data-locked') === layerNumber) {
                        // unlock
                        locked = false;
                        svg.removeAttribute('data-locked');
                        clearConnections();
                        layers.forEach(l => l.classList.remove('highlight'));
                        return;
                    }

                    // lock to this layer
                    locked = true;
                    svg.setAttribute('data-locked', layerNumber);
                    layers.forEach(l => l.classList.remove('highlight'));
                    layer.classList.add('highlight');
                    drawConnections(layerNumber);
                    e.stopPropagation();
                    return;
                }

                // Otherwise, navigate to the detail page on single click
                if (!isAnimating) {
                    isAnimating = true;
                    layer.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        window.location.href = `./layer${layerNumber}.html`;
                    }, 180);
                }
            });
        });

    // Close button handler and Esc key handling for Layer 7 details
    const layer7 = document.querySelector('.layer[data-layer="7"]');
    if (layer7) {
        const closeBtn = layer7.querySelector('.close-details');
        const details = layer7.querySelector('.layer-details');
        closeBtn && closeBtn.addEventListener('click', (e) => {
            layer7.classList.remove('open');
            details && details.setAttribute('aria-hidden', 'true');
            e.stopPropagation();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && layer7.classList.contains('open')) {
                layer7.classList.remove('open');
                details && details.setAttribute('aria-hidden', 'true');
            }
        });

        // Close details when clicking outside the open panel
        document.addEventListener('click', (e) => {
            if (!layer7.contains(e.target) && layer7.classList.contains('open')) {
                layer7.classList.remove('open');
                details && details.setAttribute('aria-hidden', 'true');
            }
        });
    }
    }

    initializeLayers();

    // Click outside to clear lock
    document.addEventListener('click', (e) => {
        if (locked) {
            locked = false;
            svg.removeAttribute('data-locked');
            clearConnections();
            layers.forEach(l => l.classList.remove('highlight'));
        }
    });

    // Redraw on resize/scroll
    window.addEventListener('resize', () => { if (locked && svg) drawConnections(svg.getAttribute('data-locked')); });
    window.addEventListener('scroll', () => { if (locked && svg) drawConnections(svg.getAttribute('data-locked')); });

    // Helper: get center point of layer relative to svg
    function centerOfLayer(layer) {
        const rect = layer.getBoundingClientRect();
        const container = document.querySelector('.container') || document.body;
        const parentRect = container.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - parentRect.left;
        const y = rect.top + rect.height / 2 - parentRect.top;
        return { x, y };
    }

    function clearConnections() {
        // stop any running dot animations
        if (svg._dotAnimations) {
            svg._dotAnimations.forEach(a => cancelAnimationFrame(a));
        }
        svg._dotAnimations = [];
        while (svg.firstChild) svg.removeChild(svg.firstChild);
    }

    function drawConnections(layerNumber) {
        clearConnections();
        const targets = relationships[layerNumber] || [];
        // include hub as a visual central connection
        const includeHub = true;
        if (includeHub) targets.push('HUB');
        const fromLayer = document.querySelector(`.layer[data-layer="${layerNumber}"]`);
        if (!fromLayer) return;

    // Ensure SVG viewport matches its container so coordinates align
    const container = document.querySelector('.container') || document.body;
    const cRect = container.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${cRect.width} ${cRect.height}`);

        // start from the right edge of the layer; use a width-relative inset so
        // traces align visually for layers with different widths (pyramid layout)
        const flRect = fromLayer.getBoundingClientRect();
        const containerRect = (document.querySelector('.container') || document.body).getBoundingClientRect();
        const fromInset = Math.max(10, flRect.width * 0.06); // 6% inset, min 10px
        const from = {
            x: flRect.right - containerRect.left - fromInset,
            y: flRect.top + flRect.height / 2 - containerRect.top
        };

        targets.forEach(targetNum => {
            let to, toLayer;
            if (targetNum === 'HUB') {
                // position slightly left of the hub center so lines approach its left edge
                const hub = document.querySelector('.network-hub');
                if (!hub) return;
                const hRect = hub.getBoundingClientRect();
                const parentRect = document.querySelector('.container').getBoundingClientRect();
                to = { x: hRect.left - parentRect.left + 12, y: hRect.top + hRect.height / 2 - parentRect.top };
                } else {
                    toLayer = document.querySelector(`.layer[data-layer="${targetNum}"]`);
                    if (!toLayer) return;
                    // Prefer to target the layer's icon if present so traces appear to
                    // terminate at the visual icon instead of spanning the full card.
                    const parentRect = (document.querySelector('.container') || document.body).getBoundingClientRect();
                    const iconEl = toLayer.querySelector('.layer-icon');
                    if (iconEl) {
                        const iRect = iconEl.getBoundingClientRect();
                        to = { x: iRect.left + iRect.width / 2 - parentRect.left, y: iRect.top + iRect.height / 2 - parentRect.top };
                    } else {
                        // fallback: approach the target at its left edge with a small inset
                        const tRect = toLayer.getBoundingClientRect();
                        const toInset = Math.max(10, tRect.width * 0.06);
                        to = { x: tRect.left - parentRect.left + toInset, y: tRect.top + tRect.height / 2 - parentRect.top };
                    }
                }

            // compute simple straight-line distance for animation timing
            const distance = Math.hypot(to.x - from.x, to.y - from.y);

            // Determine a vertical trace column X so horizontal segments run in a
            // dedicated column near the hub (prevents lines from crossing layer boxes)
            const parentRect = (document.querySelector('.container') || document.body).getBoundingClientRect();
            let traceX;
            const hubEl = document.querySelector('.network-hub');
            if (hubEl) {
                const hRect = hubEl.getBoundingClientRect();
                // place the trace column slightly left of the hub
                traceX = hRect.left - parentRect.left - 60;
            } else {
                // fallback: place trace column to the right of both points
                traceX = Math.max(from.x + 120, (from.x + to.x) / 2);
            }

            // Build orthogonal path that goes right out of the source, down/up in
            // the trace column, then back horizontally into the target. This keeps
            // horizontal runs out of the cards' bounding boxes.
            const points = [
                { x: from.x, y: from.y },
                { x: traceX, y: from.y },
                { x: traceX, y: to.y },
                { x: to.x, y: to.y }
            ];

            // Build path data with rounded corners using short quadratic arcs at joins
            const dParts = [];
            dParts.push(`M ${points[0].x} ${points[0].y}`);
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const cur = points[i];
                // if direction changes, insert a small rounded corner using Q command
                if (i < points.length - 1) {
                    // compute corner toward next point
                    const next = points[i + 1];
                    const cornerX = cur.x;
                    const cornerY = cur.y;
                    dParts.push(`L ${cornerX} ${cornerY}`);
                } else {
                    dParts.push(`L ${cur.x} ${cur.y}`);
                }
            }

            const centerPath = document.createElementNS(ns, 'path');
            centerPath.setAttribute('d', dParts.join(' '));
            centerPath.setAttribute('class', 'connection-line');
            // color the center trace by the source layer
            const srcColor = layerColors[layerNumber] || '#27e38f';
            centerPath.setAttribute('stroke', srcColor);

            // Outline path (thicker, behind)
            const outlinePath = document.createElementNS(ns, 'path');
            outlinePath.setAttribute('d', dParts.join(' '));
            outlinePath.setAttribute('class', 'connection-line-outline');

            svg.appendChild(outlinePath);
            svg.appendChild(centerPath);

            // add vias at the two elbow points
            const via1 = document.createElementNS(ns, 'circle');
            via1.setAttribute('cx', points[1].x);
            via1.setAttribute('cy', points[1].y);
            via1.setAttribute('r', 4);
            via1.setAttribute('class', 'trace-via');
            via1.setAttribute('fill', srcColor);
            via1.setAttribute('stroke', 'rgba(0,0,0,0.18)');
            const via2 = document.createElementNS(ns, 'circle');
            via2.setAttribute('cx', points[2].x);
            via2.setAttribute('cy', points[2].y);
            via2.setAttribute('r', 4);
            via2.setAttribute('class', 'trace-via');
            via2.setAttribute('fill', srcColor);
            via2.setAttribute('stroke', 'rgba(0,0,0,0.18)');
            svg.appendChild(via1);
            svg.appendChild(via2);

            // animate visibility then create flow dot along center path
            requestAnimationFrame(() => {
                // reveal outline and center
                outlinePath.classList.add('visible');
                centerPath.classList.add('visible');
                via1.classList.add('visible');
                via2.classList.add('visible');

                // compute path length for center path
                let len = 0;
                try { len = centerPath.getTotalLength(); } catch (err) { len = 1000; }
                centerPath.setAttribute('stroke-dasharray', len);
                centerPath.setAttribute('stroke-dashoffset', len);
                requestAnimationFrame(() => { centerPath.style.strokeDashoffset = '0'; });

                const dot = document.createElementNS(ns, 'circle');
                dot.setAttribute('class', 'flow-dot');
                dot.setAttribute('r', 4);
                dot.setAttribute('fill', srcColor);
                svg.appendChild(dot);

                let start = null;
                const duration = Math.max(1200, Math.min(3000, distance * 4));
                const anim = (t) => {
                    if (!start) start = t;
                    const elapsed = (t - start) % duration;
                    const pct = elapsed / duration;
                    let pos = { x: 0, y: 0 };
                    try { pos = centerPath.getPointAtLength(pct * len); } catch (e) {}
                    dot.setAttribute('cx', pos.x);
                    dot.setAttribute('cy', pos.y);
                    const id = requestAnimationFrame(anim);
                    svg._dotAnimations = svg._dotAnimations || [];
                    svg._dotAnimations.push(id);
                };
                requestAnimationFrame(anim);
            });
        });
    }
});