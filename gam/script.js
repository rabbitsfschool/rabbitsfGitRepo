let config;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            config = data;
            console.log('Config loaded:', config);
            setupUI();
        })
        .catch(error => {
            console.error('Error loading config:', error);
        });
});

function setupUI() {
    const mainMenu = document.getElementById('mainMenu');
    const emailOptions = document.getElementById('emailOptions');
    const classroomOptions = document.getElementById('classroomOptions');
    const driveOptions = document.getElementById('driveOptions');
    const formContainer = document.getElementById('formContainer');

    mainMenu.addEventListener('change', () => {
        if (mainMenu.value === 'Email') {
            emailOptions.style.display = 'block';
            classroomOptions.style.display = 'none';
            driveOptions.style.display = 'none';
            formContainer.innerHTML = '';
            populateEmailOptions();
        } else if (mainMenu.value === 'Classroom') {
            emailOptions.style.display = 'none';
            classroomOptions.style.display = 'block';
            driveOptions.style.display = 'none';
            formContainer.innerHTML = '';
            populateClassroomButtons();
        } else if (mainMenu.value === 'Drive Files') {
            emailOptions.style.display = 'none';
            classroomOptions.style.display = 'none';
            driveOptions.style.display = 'block';
            formContainer.innerHTML = '';
            populateDriveOptions();
        } else {
            emailOptions.style.display = 'none';
            classroomOptions.style.display = 'none';
            driveOptions.style.display = 'none';
            formContainer.innerHTML = '';
        }
    });

    const emailSubMenu = document.getElementById('emailSubMenu');
    emailSubMenu.addEventListener('change', () => {
        const selectedOption = config.sections.find(s => s.name === 'Email').options.find(o => o.name === emailSubMenu.value);
        if (selectedOption) {
            createForm(selectedOption, 'Email');
        } else {
            formContainer.innerHTML = '';
        }
    });

    const driveSubMenu = document.getElementById('driveSubMenu');
    driveSubMenu.addEventListener('change', () => {
        const selectedOption = config.sections.find(s => s.name === 'Drive Files').options.find(o => o.name === driveSubMenu.value);
        if (selectedOption) {
            createForm(selectedOption, 'Drive Files');
        } else {
            formContainer.innerHTML = '';
        }
    });
}

function populateEmailOptions() {
    const emailSubMenu = document.getElementById('emailSubMenu');
    emailSubMenu.innerHTML = '<option value="">Select an email option</option>';
    const emailSection = config.sections.find(s => s.name === 'Email');
    if (emailSection && emailSection.options) {
        emailSection.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.name;
            optionElement.textContent = option.name;
            emailSubMenu.appendChild(optionElement);
        });
    }
}

function populateClassroomButtons() {
    const classroomOptions = document.getElementById('classroomOptions');
    classroomOptions.innerHTML = '';
    const classroomSection = config.sections.find(s => s.name === 'Classroom');
    if (classroomSection && classroomSection.options) {
        classroomSection.options.forEach(option => {
            if (option.type === 'link') {
                const button = document.createElement('button');
                button.textContent = option.name;
                button.onclick = () => window.open(option.url, '_blank');
                button.id = 'openDataSheet';
                classroomOptions.appendChild(button);
            } else {
                const button = document.createElement('button');
                button.textContent = option.name;
                button.onclick = () => runClassroomCommand(option.name);
                classroomOptions.appendChild(button);
            }
        });
    }
}

function createForm(option, sectionName) {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = `
        ${option.fields.map(field => `
            <input type="text" id="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>
        `).join('')}
        <button onclick="executeCommand('${sectionName || 'Email'}', '${option.name}')">Execute</button>
    `;
}

function executeCommand(sectionName, optionName) {
    console.log('Executing command:', sectionName, optionName);
    const section = config.sections.find(s => s.name === sectionName);
    if (!section) {
        console.error(`No section found with name: ${sectionName}`);
        return;
    }
    const option = section.options.find(o => o.name === optionName);
    if (!option) {
        console.error(`No option found with name: ${optionName} in section ${sectionName}`);
        return;
    }
    
    const fields = {};
    if (option.fields) {
        option.fields.forEach(field => {
            fields[field.name] = document.getElementById(field.name).value;
        });
    }

    showProgressBar();
    fetch('/api/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: sectionName, option: optionName, fields }),
    })
    .then(response => response.json())
    .then(data => {
        hideProgressBar();
        alert(data.message);
    })
    .catch(error => {
        hideProgressBar();
        console.error('Error executing command:', error);
        alert('Error: ' + error);
    });
}

function showProgressBar() {
    document.getElementById('progressModal').style.display = 'block';
}

function hideProgressBar() {
    document.getElementById('progressModal').style.display = 'none';
}

// Keep existing functions for checkClassId and openDataSheet

// Add this function for Classroom buttons
function runClassroomCommand(command) {
    console.log('Running classroom command:', command);  // Debug log
    const option = config.sections.find(s => s.name === 'Classroom').options.find(o => o.name === command);
    if (!option) {
        console.error(`No option found for command: ${command}`);
        return;
    }
    
    if (option.name === 'Check a Class ID') {
        createCheckClassIdForm();
    } else if (option.fields) {
        createForm(option, 'Classroom');
    } else {
        showConfirmationPopup(command);
    }
}

function createCheckClassIdForm() {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = `
        <input type="text" id="className" placeholder="Class Name" required>
        <button onclick="checkClassId()">Check Class ID</button>
    `;
}

function checkClassId() {
    const className = document.getElementById('className').value;

    if (!className) {
        alert('Please enter a Class Name');
        return;
    }

    showProgressBar();
    fetch('/api/checkClassId', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ className }),
    })
    .then(response => response.json())
    .then(data => {
        hideProgressBar();
        alert(data.message);
    })
    .catch(error => {
        hideProgressBar();
        console.error('Error checking class ID:', error);
        alert('Error: ' + error);
    });
}

function showConfirmationPopup(command) {
    const popup = document.createElement('div');
    popup.className = 'confirmation-popup';
    popup.innerHTML = `
        <div class="confirmation-content">
            <p>Are you sure you want to proceed with "${command}"?</p>
            <button onclick="confirmAction('${command}')">Proceed</button>
            <button onclick="closeConfirmationPopup()">Cancel</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function closeConfirmationPopup() {
    const popup = document.querySelector('.confirmation-popup');
    if (popup) {
        popup.remove();
    }
}

function confirmAction(command) {
    closeConfirmationPopup();
    executeCommand('Classroom', command);
}

function populateDriveOptions() {
    const driveSubMenu = document.getElementById('driveSubMenu');
    driveSubMenu.innerHTML = '<option value="">Select a File option</option>';
    const driveSection = config.sections.find(s => s.name === 'Drive Files');
    if (driveSection && driveSection.options) {
        driveSection.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.name;
            optionElement.textContent = option.name;
            driveSubMenu.appendChild(optionElement);
        });
    }
}