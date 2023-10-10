async function addLearningLine(llId, llName) {
    try {
        const response = await fetch('/add/learningLine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: llId, name: llName })
        });

        const data = await response.json();

        if (!data.success) {
            console.error(data.message);
            // Handle error, maybe show an error message to the user
        }
    } catch (error) {
        console.error('Error calling server:', error);
        // Handle network or other errors, maybe show an error message to the user
    }
    return
}
const taxonomyHierarchy = {
    'BTL_Remember': ['BTL_Remember', 'BTL_Understand', 'BTL_Apply', 'BTL_Analyse', 'BTL_Evaluate', 'BTL_Create'],
    'BTL_Understand': ['BTL_Understand', 'BTL_Apply', 'BTL_Analyse', 'BTL_Evaluate', 'BTL_Create'],
    'BTL_Apply': ['BTL_Apply', 'BTL_Analyse', 'BTL_Evaluate', 'BTL_Create'],
    'BTL_Analyse': ['BTL_Analyse', 'BTL_Evaluate', 'BTL_Create'],
    'BTL_Evaluate': ['BTL_Evaluate', 'BTL_Create'],
    'BTL_Create': ['BTL_Create']
};

document.getElementById('submitLearningLine').addEventListener('click', function (event) {
    event.preventDefault();
    const llKey = document.getElementById('nameLearningLine').value;
    addLearningLine(llKey.replace(/-/g, '_').replace(/[/'’]/g, '').replace(/ /g, '')
        , llKey);
    document.getElementById('nameLearningLine').value = "";
});

let courseName=[];

async function getCourseDetails(){
    try {
        const response = await fetch('/course/details');
        const data = await response.json();
        data.courses.forEach(courses => {
            courseName[courses.id] = courses.name;
            // console.log(courses.id, courses.name);
        });
        return

    } catch (error) {
        console.error('Error fetching learning lines:', error);
    }
}


document.getElementById('addTrajectory').addEventListener('click', function (event) {
    populateDropdowns();
});
async function populateDropdowns() {
    // Clear existing options first
    const selectElement = document.getElementById('selectLearningLine');
    selectElement.innerHTML = '';

    try {
        const response = await fetch('/query/learningLines');
        const data = await response.json();

        // Sort learningLines alphabetically by name
        const sortedLearningLines = data.learningLines.sort((a, b) => a.name.localeCompare(b.name));

        // Iterate over the sorted learningLines array and create option elements
        sortedLearningLines.forEach(line => {
            const optionElement = document.createElement('option');
            optionElement.value = line.id;
            optionElement.innerText = line.name;
            selectElement.appendChild(optionElement);
        });

    } catch (error) {
        console.error('Error fetching learning lines:', error);
    }
    fetch('areas.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('trajectoryCategory');

            // Remove existing checkboxes to avoid duplicates
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            // Sort keys and create checkboxes
            Object.keys(data).sort().forEach(area => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.classList.add('form-check');

                const checkboxElement = document.createElement('input');
                checkboxElement.setAttribute('type', 'checkbox');
                checkboxElement.setAttribute('id', area);
                checkboxElement.classList.add('form-check-input');

                const labelElement = document.createElement('label');
                labelElement.setAttribute('for', area);
                labelElement.classList.add('form-check-label');
                labelElement.textContent = area;

                checkboxWrapper.appendChild(checkboxElement);
                checkboxWrapper.appendChild(labelElement);
                container.appendChild(checkboxWrapper);
            });
        })
        .catch(error => {
            console.error('Error fetching areas:', error);
        });

}
document.getElementById('trajectoryCategory').addEventListener('change', (event) => {
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        updateSubdomains();
    }
});

function updateSubdomains() {
    const container = document.getElementById('trajectorySubdomains');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    fetch('areas.json')
        .then(response => response.json())
        .then(data => {
            const selectedAreas = getSelectedAreas();
            selectedAreas.forEach(area => {
                if (data[area]) {
                    // Sort subdomains before creating checkboxes
                    data[area].sort().forEach(subdomain => {
                        const checkboxWrapper = document.createElement('div');
                        checkboxWrapper.classList.add('form-check');

                        const checkboxElement = document.createElement('input');
                        checkboxElement.setAttribute('type', 'checkbox');
                        checkboxElement.setAttribute('id', subdomain);
                        checkboxElement.classList.add('form-check-input');
                        checkboxElement.checked = true;

                        const labelElement = document.createElement('label');
                        labelElement.setAttribute('for', subdomain);
                        labelElement.classList.add('form-check-label');
                        labelElement.textContent = subdomain

                        checkboxWrapper.appendChild(checkboxElement);
                        checkboxWrapper.appendChild(labelElement);
                        container.appendChild(checkboxWrapper);
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching areas:', error);
        });
    populateTopics();
}

function getSelectedAreas() {
    const checkboxes = document.querySelectorAll('#trajectoryCategory input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.id);
        }
    });
    return selected;
}
document.getElementById('trajectoryTopicFilter').addEventListener('change', (event) => {
    const topicSelectContainer = document.getElementById('trajectoryControlDiv');
    if (event.target.value === "Yes") {
        topicSelectContainer.style.display = 'block';
        populateTopics();
    } else {
        topicSelectContainer.style.display = 'none';
    }
});

document.getElementById('trajectorySubdomains').addEventListener('change', (event) => {
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        populateTopics();
    }
});
function populateTopics() {
    const trajectoryTopics = document.getElementById('trajectoryTopics');

    // Clear previous checkboxes
    while (trajectoryTopics.firstChild) {
        trajectoryTopics.removeChild(trajectoryTopics.firstChild);
    }

    const selectedSubDomains = getSelectedSubdomains();
    // console.log('Selected Subdomains:', selectedSubDomains);


    fetch('/query/subdomain/topics')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // console.log('Received Data:', data);

            // Filter topics based on selected subdomains
            const filteredTopics = data.nodes.filter(topic => {
                return topic.subDomain.some(subDomain => selectedSubDomains.includes(subDomain));
            });

            // console.log('Filtered Topics:', filteredTopics);

            // Sort topics alphabetically
            filteredTopics.sort((a, b) => a.name.localeCompare(b.name));

            // Create checkboxes for each topic
            filteredTopics.forEach(topic => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.classList.add('form-check');

                const checkboxElement = document.createElement('input');
                checkboxElement.setAttribute('type', 'checkbox');
                checkboxElement.setAttribute('id', topic.id);
                checkboxElement.classList.add('form-check-input');
                checkboxElement.checked = true;

                const labelElement = document.createElement('label');
                labelElement.setAttribute('for', topic.id);
                labelElement.classList.add('form-check-label');
                labelElement.textContent = topic.name;

                checkboxWrapper.appendChild(checkboxElement);
                checkboxWrapper.appendChild(labelElement);
                trajectoryTopics.appendChild(checkboxWrapper);
            });
        })
        .catch(error => {
            console.error('Error fetching topics:', error);
        });
}

function getSelectedSubdomains() {
    const checkboxes = document.querySelectorAll('#trajectorySubdomains input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push("SubDomain" + checkbox.id.replace(/ /g, ''));
        }
    });
    return selected;
}

function getSelectedTopics() {
    const checkboxes = document.querySelectorAll('#trajectoryTopics input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.id);
        }
    });
    return selected;
}

document.getElementById('submitTrajectory').addEventListener('click', function (event) {
    event.preventDefault();
    submitTrajectoryOperations();
});


async function submitTrajectoryOperations() {
    let subdomains = getSelectedSubdomains()
    let courses = await getCoursesOfTrajectory(subdomains, []);
    await getCourseDetails();
    const trajectoryName = document.getElementById('trajectoryName').value;
    const learningLine = document.getElementById('selectLearningLine').value;
    const taxonomyLevel = document.getElementById('trajectoryTaxonomyRequirement').value;
    const results = await compareCourseTrajectory(courses, subdomains);
    displayTrajectory(results, learningLine,trajectoryName, taxonomyLevel);
}

function displayTrajectory(results, learningLine,trajectoryName, taxonomyLevel) {
    // Close the modal (using Bootstrap's built-in methods)
    $('#trajectoryModal').modal('hide');

    // Reference to the result container
    const resultContainer = document.getElementById('trajectoryResultsContainer');

    // // Clear previous results
    // resultContainer.innerHTML = '';

    // Create the main container for the new table
    const table = document.createElement('table');
    table.style.backgroundColor = 'transparent';  // Make the table background transparent

    table.classList.add('table', 'table-bordered'); // Using Bootstrap classes for table styling

    // Table header
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    ['Course', 'Course Name','Label', 'Taxonomy'].forEach(header => {
        const th = document.createElement('th');
        th.style.backgroundColor = 'white';
        th.style.opacity = '90%';

        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    for (let subdomain in results) {
        results[subdomain].forEach(courseData => {
            const row = document.createElement('tr');

            // Course code
            const courseTd = document.createElement('td');
            courseTd.style.backgroundColor = 'white';
            courseTd.style.opacity = '80%';
            courseTd.textContent = courseData.courseId; // Modify this based on where you get course name from
            row.appendChild(courseTd);

            const name = document.createElement('td');
            name.style.backgroundColor = 'white';
            name.style.opacity = '80%';
            name.textContent = courseName["Course"+courseData.courseId]; // Modify this based on where you get course name from
            row.appendChild(name);

            // Subdomain
            const subdomainTd = document.createElement('td');
            subdomainTd.style.backgroundColor = 'white';
            subdomainTd.style.opacity = '80%';
            subdomainTd.textContent = subdomain.replace('SubDomain','');;
            row.appendChild(subdomainTd);

            // Taxonomy
            const taxonomyTd = document.createElement('td');
            taxonomyTd.style.backgroundColor = 'white';
            taxonomyTd.style.opacity = '80%';
            taxonomyTd.textContent = courseData.taxonomy.map(t => t.TaxonomyLevel.replace('BTL_','')).join(', ');
            row.appendChild(taxonomyTd);

            tbody.appendChild(row);
        });
    }

    table.appendChild(tbody);

    const tableWrapper = document.createElement('div');
    tableWrapper.id = 'trajectoryResults'; 
    // Title & Taxonomy Level
    const titleElement = document.createElement('h2');
    titleElement.textContent = trajectoryName;
    tableWrapper.appendChild(titleElement);

    const learningLineElement = document.createElement('h5');
    learningLineElement.textContent = learningLine;
    tableWrapper.appendChild(learningLineElement);

    const taxonomyLevelElement = document.createElement('h6');
    taxonomyLevelElement.textContent = taxonomyLevel;
    tableWrapper.appendChild(taxonomyLevelElement);

    tableWrapper.appendChild(table);

    resultContainer.appendChild(tableWrapper);
}



async function compareCourseTrajectory(courses, subdomains) {
    const selectedTaxonomy = document.getElementById("trajectoryTaxonomyRequirement").value;
    const minimumTaxonomyLevels = taxonomyHierarchy[selectedTaxonomy];

    let suitableCoursesForSubdomains = {};

    for (let subdomain of subdomains) {
        suitableCoursesForSubdomains[subdomain] = [];

        for (let course of courses) {
            const response = await fetch(`/course/objective?id=${course}`);
            const data = await response.json();

            // Check if subdomain exists in the fetched data's Subdomain
            const subdomainData = data.Subdomain.find(item => item.id === subdomain);
            if (subdomainData) {
                const isAtLeastUnderstand = subdomainData.taxonomy.some(taxonomy => {
                    return taxonomyHierarchy['BTL_Understand'].includes(taxonomy.TaxonomyLevel);
                });

                if (isAtLeastUnderstand) {
                    suitableCoursesForSubdomains[subdomain].push({
                        courseId: course,
                        taxonomy: subdomainData.taxonomy // Embedding the taxonomy information here
                    });
                }
            }
        }
    }

    return suitableCoursesForSubdomains;
}



async function getCoursesOfTrajectory(subdomains, topics = []) {
    let courses = [];

    if (document.getElementById('trajectoryTopicFilter').value === "Yes") {
        // If topics filter is on, get the selected topics
        topics = getSelectedTopics();

        // Nested loop through each subdomain and topic
        for (let subDomain of subdomains) {
            for (let topic of topics) {
                try {
                    const response = await fetch(`/query/trajectory/topic?subDomain=${subDomain}&topic=${topic}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    const data = await response.json();

                    // Check if 'trajectory' exists in the data and if it's an array
                    if (data.trajectory && Array.isArray(data.trajectory)) {
                        data.trajectory.forEach(trajectoryItem => {
                            if (trajectoryItem.id) {
                                courses.push(trajectoryItem.id);
                            }
                        });
                    }


                } catch (error) {
                    console.error(`Error fetching courses for subDomain=${subDomain} & topic=${topic}:`, error);
                }
            }
        }
    } else {
        // If topics filter is off, just loop through the subdomains
        for (let subDomain of subdomains) {
            try {
                const response = await fetch(`/query/trajectory/domain?subDomain=${subDomain}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();

                // Check if 'trajectory' exists in the data and if it's an array
                if (data.trajectory && Array.isArray(data.trajectory)) {
                    data.trajectory.forEach(trajectoryItem => {
                        if (trajectoryItem.id) {
                            courses.push(trajectoryItem.id);
                        }
                    });
                }


            } catch (error) {
                console.error(`Error fetching courses for subDomain=${subDomain}:`, error);
            }
        }
    }
    return [...new Set(courses)];
}




