document.addEventListener("DOMContentLoaded", function () {
            const scoresTable = document.getElementById("scores-table");
            const colorblindModeSwitch = document.getElementById("colorblindModeSwitch");
            const showGradientSwitch = document.getElementById("showGradientSwitch");
            const showExtendedRowsSwitch = document.getElementById("showExtendedRowsSwitch");
            const textContentDropdown = document.getElementById("textContentDropdown");
            const showCountSwitch = document.getElementById("showCountSwitch");
            const yearSliderContainer = document.getElementById("yearSliderContainer");
            const yearSlider = document.getElementById("yearSlider");
            const selectedYearLabel = document.getElementById("selectedYear");

            let currentSliderValue = parseInt(yearSlider.value);

            // Fetch data from the API
            fetch('https://www.backend.audlstats.com/api/v1/games?date=2012-04-14:')
                .then(response => response.json())
                .then(data => {
                    // Process the API response
                    if (data && data.object === "list" && data.data) {
                        populateScoresTable(data.data);
                    } else {
                        console.error("Invalid API response");
                    }
                })
                .catch(error => console.error("Error fetching data:", error));
 
                // Function to populate the scores table
function populateScoresTable(scores) {
    // Filter out scores where either team is 'allstar1' or 'allstar2'
    const filteredScores = scores.filter(score => 
        !(score.homeTeamID === "allstars1" || score.awayTeamID === "allstars1" ||
          score.homeTeamID === "allstars2" || score.awayTeamID === "allstars2")
    );

                // Extract unique team scores for x and y axes and sort them
                const xAxes = Array.from(new Set(filteredScores.map(score => Math.max(score.homeScore, score.awayScore)))).sort((a, b) => a - b);
                const yAxes = Array.from(new Set(filteredScores.map(score => Math.min(score.homeScore, score.awayScore)))).sort((a, b) => b - a).reverse(); // Reverse order
 
                // Create table header with x-axis values
                const headerRow = scoresTable.tHead.rows[1];
 
                // Add winning scores to the header
                for (let i = 1; i <= 45; i++) {
                    const th = document.createElement("th");
                    th.textContent = i;
                    headerRow.appendChild(th);
                }
 
                // Add missing columns up to 45
                for (let i = Math.max(...xAxes) + 1; i <= 45; i++) {
                    const th = document.createElement("th");
                    th.textContent = i;
                    headerRow.appendChild(th);
                }
 
                // Create table body with y-axis values and fill in the scores
                const tbody = scoresTable.tBodies[0];
 
                // Create a map to store the count of each score
                const scoreCountMap = new Map();
 
                // Create a map to store the first year of each score
                const firstYearMap = new Map();
 
                // Create a map to store the last year of each score
                const lastYearMap = new Map();
 
                // Process scores in chronological order
                filteredScores.sort((a, b) => new Date(a.startTimestamp) - new Date(b.startTimestamp));
 
                // Count occurrences and find the first and last years of each score
                filteredScores.forEach(score => {
                    const key = `${Math.max(score.homeScore, score.awayScore)}-${Math.min(score.homeScore, score.awayScore)}`;
                    scoreCountMap.set(key, (scoreCountMap.get(key) || 0) + 1);
 
                    // Update first year if not already set
                    if (!firstYearMap.has(key)) {
                        firstYearMap.set(key, new Date(score.startTimestamp).getFullYear());
                    }
 
                    // Always update last year to the latest occurrence
                    lastYearMap.set(key, new Date(score.startTimestamp).getFullYear());
                });
 
                // Calculate the maximum losing score based on the "Show Extended Rows" switch
                const maxLosingScore = showExtendedRowsSwitch.checked ? 45 : 33;
 
                // Add rows up to the maximum losing score
                for (let j = Math.min(...yAxes); j <= maxLosingScore; j++) {
                    const tr = document.createElement("tr");
 
                    if (j === Math.min(...yAxes)) {
                        // Add the rowspan header cell only in the first row
                        const losingScoreHeader = document.createElement("th");
                        losingScoreHeader.classList.add("losing-score-header");
                        losingScoreHeader.setAttribute("rowspan", maxLosingScore - Math.min(...yAxes) + 2);
                        losingScoreHeader.textContent = "Losing Team Score";
                        tr.appendChild(losingScoreHeader);
                    }
 
                    // Create y-axis cell
                    const yCell = document.createElement("td");
                    yCell.textContent = j;
                    yCell.classList.add("losing-score");
                    tr.appendChild(yCell);
 
                    // Iterate through all possible winning scores
                    for (let winningScore = 1; winningScore <= 45; winningScore++) {
                        const key = `${winningScore}-${j}`;
                        const count = scoreCountMap.get(key) || 0;
                        const firstYear = firstYearMap.get(key) || '';
                        const lastYear = lastYearMap.get(key) || '';
 
                        const td = document.createElement("td");
                        const content = document.createElement("div");
                        content.classList.add("content");
                        content.dataset.count = count;
                        content.dataset.firstYear = firstYear;
                        content.dataset.lastYear = lastYear;
 
                        // Set initial text content based on dropdown selection
                        content.textContent = textContentDropdown.value === 'count' ? count :
                                              textContentDropdown.value === 'firstYear' ? firstYear :
                                              textContentDropdown.value === 'lastYear' ? lastYear : count;
 
                        td.appendChild(content);

                        // Check if the game exists in the provided data
                        if (count > 0) {
                            const gradientColor = calculateGradientColor(count, firstYear, lastYear);
                            td.style.background = showGradientSwitch.checked ? `linear-gradient(${gradientColor}, ${gradientColor})` : (colorblindModeSwitch.checked ? 'purple' : 'green');
                            td.classList.add("filled");
                            content.style.display = showCountSwitch.checked ? "block" : "none"; // Show content if "Show Count" switch is checked
                        } else {
                            // Check if below the tied diagonal and not a tied game
                            if (winningScore < j) {
                                td.classList.add("impossible");
                            }
                        }
 
                        tr.appendChild(td);
                    }
 
                    tbody.appendChild(tr);
                }
 
                // Function to calculate gradient color based on the count, first year, or last year
                function calculateGradientColor(count, firstYear, lastYear) {
                    // Choose a color based on the text content selected in the dropdown
                    const valueToUse = textContentDropdown.value === '' ? 'count' : textContentDropdown.value;
                    switch (valueToUse) {
                        case 'count':
                            return calculateCountGradientColor(count);
                        case 'firstYear':
                            return calculateYearGradientColor(parseInt(firstYear));
                        case 'lastYear':
                            return calculateYearGradientColor(parseInt(lastYear));
                        default:
                            return 'purple';
                    }
                }
 
                // Function to calculate gradient color based on the count
                function calculateCountGradientColor(count) {
                    let hueStart, hueEnd, saturation = 70, lightness = 65;

                    if (colorblindModeSwitch.checked) {
        // Purple to Green for colorblind mode
        hueStart = 270; // Purple hue
        hueEnd = 120; // Green hue
    } else {
        // Blue to Yellow-Orange for standard mode
        hueStart = 240; // Blue hue
        hueEnd = 0; // Red hue
    }

    const minCount = Math.min(...Array.from(scoreCountMap.values()));
    const maxCount = Math.max(...Array.from(scoreCountMap.values()));

    if (minCount === maxCount) {
        return `hsl(${hueStart}, ${saturation}%, ${lightness}%)`;
    }

    const countPosition = count - minCount;
    const countRange = maxCount - minCount;
    const normalizedCountPosition = countRange > 0 ? countPosition / countRange : 0;
    
    // Interpolate between blue and red hues
    const hue = hueStart + (hueEnd - hueStart) * normalizedCountPosition;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
 
function calculateYearGradientColor(year) {
    let hueStart, hueEnd, saturation = 70, lightness = 65;

    if (colorblindModeSwitch.checked) {
        // Purple to Green for colorblind mode
        hueStart = 270; // Purple hue
        hueEnd = 120; // Green hue
    } else {
        // Blue to Yellow-Orange for standard mode
        hueStart = 240; // Blue hue
        hueEnd = 0; // Red hue
    }

    const minYear = Math.min(...Array.from(firstYearMap.values()));
    const maxYear = Math.max(...Array.from(lastYearMap.values()));

    if (minYear === maxYear) {
        return `hsl(${hueStart}, ${saturation}%, ${lightness}%)`;
    }

    const yearPosition = year - minYear;
    const yearRange = maxYear - minYear;
    const normalizedYearPosition = yearRange > 0 ? yearPosition / yearRange : 0;

    // Interpolate between purple and green hues for colorblind mode, or between blue and yellow for standard mode
    const hue = hueStart + (hueEnd - hueStart) * normalizedYearPosition;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

                function updateTable() {
                const contentElements = scoresTable.getElementsByClassName("content");
                for (const contentElement of contentElements) {
                    const countText = contentElement.dataset.count;
                    const firstYearText = contentElement.dataset.firstYear;
                    const lastYearText = contentElement.dataset.lastYear;

                    contentElement.textContent = textContentDropdown.value === 'count' ? countText :
                                                  textContentDropdown.value === 'firstYear' ? firstYearText :
                                                  textContentDropdown.value === 'lastYear' ? lastYearText : countText;
                    contentElement.style.display = showCountSwitch.checked ? "block" : "none";
                }
                updateGradients();

                if (textContentDropdown.value === 'firstYear') {
                    filterRowsByYear(parseInt(yearSlider.value));
                } else {
                    updateGradients();
                }
            }
 
                function updateGradients() {
                    const filledCells = scoresTable.getElementsByClassName("filled");
                    for (const filledCell of filledCells) {
                        const content = filledCell.querySelector(".content");
                        const count = content ? parseInt(content.dataset.count) : 0;
                        const firstYear = content ? parseInt(content.dataset.firstYear) : 0;
                        const lastYear = content ? parseInt(content.dataset.lastYear) : 0;
                        const gradientColor = calculateGradientColor(count, firstYear, lastYear);

                        filledCell.dataset.originalGradient = gradientColor; // Save the original gradient
 
                        if (showGradientSwitch.checked) {
                            filledCell.style.background = `linear-gradient(${gradientColor}, ${gradientColor})`;
                        } else {
                            filledCell.style.background = colorblindModeSwitch.checked ? 'purple' : 'green';
                        }
 
                    }
                }

                function filterRowsByYear(selectedYear) {
                currentSliderValue = selectedYear; // Update current slider value
                const filledCells = scoresTable.getElementsByClassName("filled");
                for (const filledCell of filledCells) {
                    const content = filledCell.querySelector(".content");
                    const firstYear = parseInt(content.dataset.firstYear);

                    if (showGradientSwitch.checked) {
                        // Hide cells with years greater than the selected slider value when gradient is on
                        if (firstYear > selectedYear) {
                            filledCell.style.visibility = 'hidden';
                        } else {
                            filledCell.style.visibility = 'visible';
                        }
                    } else {
                        // Apply red/green/white colors when gradient is off
                        filledCell.style.visibility = 'visible'; // Ensure cells are visible when gradient is off
                        if (firstYear === selectedYear) {
                            filledCell.style.backgroundColor = colorblindModeSwitch.checked ? 'green' : 'red'; // Set background color to red/blue
                            filledCell.style.color = 'white'
                        } else if (firstYear < selectedYear) {
                            filledCell.style.backgroundColor = colorblindModeSwitch.checked ? 'purple' : 'green'; // Set background color to green
                            filledCell.style.color = 'white'
                        } else {
                            filledCell.style.backgroundColor = "rgba(211,211,211,0.3)"; // Set background color to white
                            filledCell.style.color = "rgba(211,211,211,0.3)";
                        }
                    }
                }
            }
            
                // Add event listeners
colorblindModeSwitch.addEventListener("change", updateTable);
showGradientSwitch.addEventListener("change", rebuildTable);
showExtendedRowsSwitch.addEventListener("change", rebuildTable);
textContentDropdown.addEventListener("change", rebuildTable);

// Function to rebuild the table
function rebuildTable() {
    // Get the current tbody
    const tbody = scoresTable.tBodies[0];
    
    // Save the current header row
    const headerRows = scoresTable.tHead.rows;
 
    // Rebuild the header
    scoresTable.tHead.innerHTML = '';
 
    // Create header rows
    const headerRow1 = document.createElement("tr");
    const headerCell = document.createElement("th");
    headerCell.classList.add("winning-score");
    headerCell.setAttribute("colspan", '47'); // Adjust colspan for the winning scores
    headerCell.textContent = "Winning Team Score";
    headerRow1.appendChild(headerCell);
    scoresTable.tHead.appendChild(headerRow1);
    
    const headerRow2 = document.createElement("tr");
    headerRow2.appendChild(document.createElement("th")); // Empty cell for alignment
    headerRow2.appendChild(document.createElement("th")); // Empty cell for alignment
    for (let i = 1; i <= 45; i++) {
        const th = document.createElement("th");
        th.textContent = i;
        headerRow2.appendChild(th);
    }
    scoresTable.tHead.appendChild(headerRow2);
 
    // Clear the tbody
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
 
    // Add rows up to the maximum losing score
    const maxLosingScore = showExtendedRowsSwitch.checked ? 45 : 33;
    for (let j = Math.min(...yAxes); j <= maxLosingScore; j++) {
        const tr = document.createElement("tr");
 
        if (j === Math.min(...yAxes)) {
            // Add the rowspan header cell only in the first row
            const losingScoreHeader = document.createElement("th");
            losingScoreHeader.classList.add("losing-score-header");
            losingScoreHeader.setAttribute("rowspan", maxLosingScore - Math.min(...yAxes) + 2);
            losingScoreHeader.textContent = "Losing Team Score";
            tr.appendChild(losingScoreHeader);
        }
 
        // Create y-axis cell
        const yCell = document.createElement("td");
        yCell.textContent = j;
        yCell.classList.add("losing-score");
        tr.appendChild(yCell);
 
        // Iterate through all possible winning scores
        for (let winningScore = 1; winningScore <= 45; winningScore++) {
            const key = `${winningScore}-${j}`;
            const count = scoreCountMap.get(key) || 0;
            const firstYear = firstYearMap.get(key) || '';
            const lastYear = lastYearMap.get(key) || '';
 
            const td = document.createElement("td");
            const content = document.createElement("div");
            content.classList.add("content");
            content.dataset.count = count;
            content.dataset.firstYear = firstYear;
            content.dataset.lastYear = lastYear;
 
            // Set initial text content based on dropdown selection
            content.textContent = textContentDropdown.value === 'count' ? count :
                                  textContentDropdown.value === 'firstYear' ? firstYear :
                                  textContentDropdown.value === 'lastYear' ? lastYear : count;
 
            td.appendChild(content);
 
            // Check if the game exists in the provided data
            if (count > 0) {
                const gradientColor = calculateGradientColor(count, firstYear, lastYear);
                td.style.background = showGradientSwitch.checked ? `linear-gradient(${gradientColor}, ${gradientColor})` : 
                                        (colorblindModeSwitch.checked ? 'purple' : 'green');
                td.classList.add("filled");
                content.style.display = showCountSwitch.checked ? "block" : "none"; // Show content if "Show Count" switch is checked
            } else {
                // Check if below the tied diagonal and not a tied game
                if (winningScore < j) {
                    td.classList.add("impossible");
                }
            }
 
            tr.appendChild(td);
        }
 
        tbody.appendChild(tr);
    }
 
    updateGradients();
    updateTable();
}

 
textContentDropdown.addEventListener("change", function () {
                updateTable();
                yearSlider.style.display = textContentDropdown.value === 'firstYear' ? "block" : "none";
                yearLabel.style.display = textContentDropdown.value === 'firstYear' ? "block" : "none";
                if (textContentDropdown.value === 'firstYear') {
                    filterRowsByYear(currentSliderValue);
                } else {
                    updateGradients();
                }
            });

            yearSlider.addEventListener("input", function () {
                selectedYearLabel.textContent = yearSlider.value;
                currentSliderValue = parseInt(yearSlider.value);
                filterRowsByYear(currentSliderValue);
            });

            showCountSwitch.addEventListener("change", updateTable);

            updateTable();
 
            }
        });
 
        document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("scores-table");
 
    table.addEventListener("mouseover", function (event) {
        let target = event.target;
 
        // Navigate to the parent <th> or <td> if the target is a text node inside a cell
        while (target && (target.tagName !== "TH" && target.tagName !== "TD")) {
            target = target.parentElement;
        }
 
        if (target && (target.tagName === "TH" || target.tagName === "TD")) {
            // Check if the cell is an impossible cell, a losing score header, or a header cell
            if (target.classList.contains("impossible") || target.classList.contains("losing-score") || target.tagName === "TH") {
                return; // Do nothing if the cell is impossible, a losing score header, or a header
            }
 
            const row = target.parentNode;
            const cellIndex = target.cellIndex;
 
            // Determine if the row is the first row in <tbody>
            const isFirstRow = row.rowIndex === 2;
 
            // Highlight the row, column, headers, and losing score headers
            highlightRow(row.rowIndex);
            highlightColumn(cellIndex, isFirstRow);
            highlightHeader(cellIndex, isFirstRow);
            highlightLosingHeaders(row);
        }
    });
 
    table.addEventListener("mouseout", function (event) {
        let target = event.target;
 
        // Navigate to the parent <th> or <td> if the target is a text node inside a cell
        while (target && (target.tagName !== "TH" && target.tagName !== "TD")) {
            target = target.parentElement;
        }
 
        if (target && (target.tagName === "TH" || target.tagName === "TD")) {
            // Check if the cell is an impossible cell, a losing score header, or a header cell
            if (target.classList.contains("impossible") || target.classList.contains("losing-score") || target.tagName === "TH") {
                return; // Do nothing if the cell is impossible, a losing score header, or a header
            }
 
            const row = target.parentNode;
            const cellIndex = target.cellIndex;
 
            // Determine if the row is the first row in <tbody>
            const isFirstRow = row.rowIndex === 2;
 
            // Remove highlight from row, column, headers, and losing score headers
            removeHighlightRow(row.rowIndex);
            removeHighlightColumn(cellIndex, isFirstRow);
            removeHighlightHeader(cellIndex, isFirstRow);
            removeHighlightLosingHeaders(row);
        }
    });
 
    function highlightRow(rowIndex) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row, index) => {
            if (index === rowIndex - 2) {
                row.classList.add("highlighted-row");
            } else {
                row.classList.remove("highlighted-row");
            }
        });
    }
 
    function removeHighlightRow(rowIndex) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row, index) => {
            if (index === rowIndex - 2) {
                row.classList.remove("highlighted-row");
            }
        });
    }
 
    function highlightColumn(cellIndex, isFirstRow) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            cells.forEach((cell, index) => {
                const adjustedIndex = isFirstRow ? index + 1 : index; // Adjust index for first row
                if (adjustedIndex === cellIndex) {
                    cell.classList.add("highlighted-column");
                } else {
                    cell.classList.remove("highlighted-column");
                }
            });
        });
 
        // Also highlight headers
        highlightHeader(cellIndex, isFirstRow);
    }
 
    function removeHighlightColumn(cellIndex, isFirstRow) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            cells.forEach((cell, index) => {
                const adjustedIndex = isFirstRow ? index + 1 : index; // Adjust index for first row
                if (adjustedIndex === cellIndex) {
                    cell.classList.remove("highlighted-column");
                }
            });
        });
 
        // Also remove highlight from headers
        removeHighlightHeader(cellIndex, isFirstRow);
    }
 
    function highlightHeader(cellIndex, isFirstRow) {
        const headers = table.querySelectorAll("thead th");
        headers.forEach((header, index) => {
            const adjustedIndex = isFirstRow ? index - 1 : index - 2; // Adjust index for first row
            if (adjustedIndex === cellIndex) {
                header.classList.add("highlighted-header");
            } else {
                header.classList.remove("highlighted-header");
            }
        });
    }
 
    function removeHighlightHeader(cellIndex, isFirstRow) {
        const headers = table.querySelectorAll("thead th");
        headers.forEach((header, index) => {
            const adjustedIndex = isFirstRow ? index - 1 : index - 2; // Adjust index for first row
            if (adjustedIndex === cellIndex) {
                header.classList.remove("highlighted-header");
            }
        });
    }
 
    function highlightLosingHeaders(row) {
        const losingHeaders = row.querySelectorAll("td.losing-score");
        losingHeaders.forEach(header => {
            header.classList.add("highlighted-losing-header");
        });
    }
 
    function removeHighlightLosingHeaders(row) {
        const losingHeaders = row.querySelectorAll("td.losing-score");
        losingHeaders.forEach(header => {
            header.classList.remove("highlighted-losing-header");
        });
    }
});

// Function to update the text of the switch label
function updateShowCountLabel() {
  const yearSelection = document.getElementById('textContentDropdown').value;
  const showCountLabel = document.getElementById('showCountLabel');

  if (yearSelection === 'firstYear') {
    showCountLabel.textContent = 'Show Year';
  } else if (yearSelection === 'lastYear') {
    showCountLabel.textContent = 'Show Year';
  } else {
    showCountLabel.textContent = 'Show Count';
  }
}

// Event listener for the year selection dropdown
document.getElementById('textContentDropdown').addEventListener('change', updateShowCountLabel);
