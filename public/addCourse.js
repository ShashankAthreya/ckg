document.getElementById('uploadBtn').addEventListener('click', async function () {
    const file = document.getElementById('csvFile').files[0];

    if (!file) {
        alert('Please select a CSV file first.');
        return;
    }

    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = async function (event) {
        const csvContent = event.target.result;
        const rows = csvContent.split('\n');
        const uploadedSubdomains = [];
        const rootTopics = [];

        const topics = rows.map(row => {
            const [index, id] = row.split(',');
            return { index, id };
        });

        const parentChildMap = {};

        topics.forEach(topic => {
            const segments = topic.index.split('.');

            if (segments.length === 1) {
                // This is a root topic, so initialize its children list
                parentChildMap[topic.id] = [];
            } else {
                const parentIndex = segments.slice(0, -1).join('.');
                const parentTopic = topics.find(t => t.index === parentIndex);
                if (parentTopic) {
                    if (!parentChildMap[parentTopic.id]) {
                        parentChildMap[parentTopic.id] = [];
                    }
                    parentChildMap[parentTopic.id].push(topic.id);
                }

            }
        });
        console.log(parentChildMap);

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');
            if (columns[2]) {
                uploadedSubdomains.push(columns[2].trim());
            }
            const indexDots = (columns[0].match(/\./g) || []).length;
            if (indexDots <= 0) {
                rootTopics.push(columns[1].trim());

            }
        }
        console.log(rootTopics);

        try {
            const response = await fetch('/query/subdomain/topics');
            const data = await response.json();
            const serverSubdomains = data.subdomains.map(sub => sub.name);

            const unmatchedSubdomainsSet = new Set(uploadedSubdomains.filter(sub => !serverSubdomains.includes(sub)));
            const unmatchedSubdomains = [...unmatchedSubdomainsSet];

            async function processUnmatchedSubdomains() {
                for (let subdomain of unmatchedSubdomains) {
                    let subDomainName = subdomain.replace(/_/g, ' '); // replace underscores with spaces
                    let subDomainID = subdomain.replace(/ /g, ''); // remove spaces
                    subDomainAddition(subDomainID, subDomainName);
                }
            }
            if (unmatchedSubdomains.length) {
                // document.getElementById('result').innerText = `Unmatched subdomains: ${unmatchedSubdomains.join(', ')}`;
                await processUnmatchedSubdomains();
            }
            const updatedResponse = await fetch('/query/subdomain/topics');
            const updatedData = await updatedResponse.json();
            const updatedSubdomainsList = updatedData.subdomains;

            // Step 2: Match and store subdomains with their IDs.
            const subdomainIDMap = {};  // An object to store subdomain names as keys and their IDs as values.
            const subDomainIDList = [];
            uploadedSubdomains.forEach(uploadedSubdomain => {
                const matchedSubdomain = updatedSubdomainsList.find(sub => sub.name === uploadedSubdomain);
                if (matchedSubdomain) {
                    subdomainIDMap[uploadedSubdomain] = matchedSubdomain.id;
                    subDomainIDList.push(matchedSubdomain.id);
                }
            });

            console.log(subDomainIDList);
            console.log(subdomainIDMap);
            const courseCode = document.getElementById('courseCode').value;
            const courseExists = await fetch(`/course/exists?id=${courseCode}`).then(res => res.json());
            if (courseExists.exists) {
            console.warn('Course already exists. Skipping...');
            } else {
            // Proceed with adding the course
            await courseAddition(courseCode, document.getElementById('courseName').value, [...new Set(subDomainIDList)], rootTopics);
            }

            for (let i = 1; i < rows.length; i++) {
                const [index, id, sub_domain, taxonomy_level, description, prerequisite, chapter, objectives, week] = rows[i].split(',').map(str => str.trim());

                // Use the subdomainIDMap to map the sub_domain name to add value
                const subDomainValue = subdomainIDMap[sub_domain];


                const nodeInCourse = await fetch(`/node/in-course?id=${id.replace(/-/g, '_').replace(/[/'’/]/g, '')}&course=Course${courseCode}`).then(res => res.json());

                if (nodeInCourse.inCourse) {
                    console.warn('Node already exists in this course.');
                } else {
                    if (nodeInCourse.nodeExists) {
                        console.warn('Node exists, but not in this course. Adding course and BTL...');
                        // Add the course and BTL to the existing node (You'd need a new endpoint to handle this scenario)
                        await addCourseAndBTLToNode(id.replace(/-/g, '_').replace(/[/'’/]/g, ''), "Course"+courseCode, "BTL_"+taxonomy_level, "Chapter"+chapter.replace(/-/g, '_').replace(/[/'’/]/g, ''), objectives, week); 
                    } else {
                        console.warn('Node does not exist. Creating it...');
                        const nodeAdded = await nodeAddition(id.replace(/-/g, '_').replace(/[/'’/]/g, ''), id.replace(/_/g, ' '), "Course" + courseCode, subDomainValue, "BTL_" + taxonomy_level);
                        if (!nodeAdded) {
                            console.error(`Failed to add node ${id}`);
                        }
                    }
                }
            }
            for (const [parentID, children] of Object.entries(parentChildMap)) {
                for (const childID of children) {
                    await connectNodes(parentID.replace(/-/g, '_').replace(/[/'’/]/g, ''), childID.replace(/-/g, '_').replace(/[/'’/]/g, ''));
                }
            }

            window.location.href = `/?courseCode=${courseCode}`;

        } catch (error) {
            console.error('Error fetching or processing data:', error);
            document.getElementById('result').innerText = 'Error comparing subdomains';
        }
        // Assuming this function is part of your event handler or any logic flow
    async function addCourseAndBTLToNode(nodeId, courseCode, newBTL, chapter, objective, week) {
        try {
        const response = await fetch('/add/course-to-node', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nodeId, courseCode, newBTL })
        });
    
        const data = await response.json();
    
        if (data.success) {
            console.log(data.message);
            // Handle success, maybe provide user feedback or update UI
        } else {
            console.error(data.message);
            // Handle error, maybe show an error message to the user
        }
        } catch (error) {
        console.error('Error calling server:', error);
        // Handle network or other errors, maybe show an error message to the user
        }
    }
  
  // Example usage:
  // addCourseAndBTLToNode('Bitcoin_Nonce', 'Course5062COPP6Y', 'BTL_Understand');
  
        async function subDomainAddition(subDomainID, subDomainName) {
            try {
                const response = await fetch('/add/subdomain', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: subDomainID, name: subDomainName })
                });

                const data = await response.json();

                if (data.success) {
                    console.log(subDomainName, 'SubDomain Added successfully.');
                    return true;
                } else {
                    console.log('Error:', data.message);
                    return false;
                }
            } catch (error) {
                console.error('Failed to add subdomain:', error);
                return false;
            }
        }
        async function courseAddition(courseId, courseName, courseSubDomains, courseRootTopics) {
            try {
                const response = await fetch('/add/course', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: courseId, name: courseName, subdomains: courseSubDomains, rootTopics: courseRootTopics })
                });

                const data = await response.json();

                if (data.success) {
                    console.log(courseName, 'Course Added successfully.');
                    return true;
                } else {
                    console.log('Error:', data.message);
                    return false;
                }
            } catch (error) {
                console.error('Failed to add Course:', error);
                return false;
            }
        }
        async function nodeAddition(nodeID, nodeName, nodeCourse, nodeSubDomain, nodeBTL) {
            try {
                const response = await fetch('/add/node', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: nodeID, name: nodeName, course: nodeCourse, subDomain: nodeSubDomain, btl: nodeBTL })
                });

                const data = await response.json();

                if (data.success) {
                    console.log(nodeID, 'Node Added successfully.');
                    return true;
                } else {
                    console.log('Error:', data.message);
                    return false;
                }
            } catch (error) {
                console.error('Failed to add node:', error);
                return false;
            }
        }
        async function connectNodes(parent, child) {
            await fetch('/node/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parent: parent, child: child })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                })
            return
        }

    };
}); 
