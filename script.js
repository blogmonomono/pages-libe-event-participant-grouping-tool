document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewSection = document.getElementById('preview-section');
    const settingsSection = document.getElementById('settings-section');
    const resultSection = document.getElementById('result-section');
    const memberList = document.getElementById('member-list');
    const memberCountSpan = document.getElementById('member-count');
    const executeBtn = document.getElementById('execute-btn');
    const resultContainer = document.getElementById('result-container');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const downloadImgBtn = document.getElementById('download-img-btn');
    const addManualBtn = document.getElementById('add-manual-btn');
    const manualText = document.getElementById('manual-text');
    const addTestDataBtn = document.getElementById('add-test-data-btn');

    // State
    let members = [];

    // --- Event Listeners ---

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Execute
    executeBtn.addEventListener('click', () => {
        const groupCount = parseInt(document.getElementById('group-count').value, 10);
        const roundCount = parseInt(document.getElementById('round-count').value, 10);

        if (members.length < groupCount) {
            alert('参加者数がグループ数より少ないです。');
            return;
        }

        const groupings = generateGroupings(members, groupCount, roundCount);
        renderResults(groupings);
    });

    // Copy Text
    copyTextBtn.addEventListener('click', () => {
        const text = generateResultText();
        navigator.clipboard.writeText(text).then(() => {
            alert('クリップボードにコピーしました！');
        });
    });

    // Download Image
    downloadImgBtn.addEventListener('click', () => {
        html2canvas(document.querySelector('.result-container')).then(canvas => {
            const link = document.createElement('a');
            link.download = `grouping-result-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });

    // Manual Input
    addManualBtn.addEventListener('click', () => {
        const text = manualText.value;
        if (!text.trim()) {
            alert('名前を入力してください。');
            return;
        }
        processManualText(text);
    });

    // Test Data Input
    addTestDataBtn.addEventListener('click', () => {
        const testMembers = [
            "もこた", "あーぷん", "たっつん", "みみこ", "けんぴ",
            "さえぴょん", "ゆーすけ丸", "なっちゃん", "しょーたろ", "ひなりん",
            "こばやん", "あいぽん", "りくまる", "ももんが", "だいちゃん",
            "ゆきち", "たまぞう", "ののか", "はる坊", "りりぃ",
            "そうた", "ふわり", "まさるん", "うたね", "かずぽん",
            "あやち", "てっちゃん", "まろん", "ひろきち", "すずね"
        ];
        members = testMembers;
        updateUIWithMembers();
        // Optional: Scroll to preview section for immediate feedback
        settingsSection.scrollIntoView({ behavior: 'smooth' });
    });

    // --- Logic ---

    function processManualText(text) {
        const lines = text.split(/\r\n|\n/);
        const extractedNames = [];

        for (const line of lines) {
            const name = line.trim();
            if (name) {
                extractedNames.push(name);
            }
        }

        if (extractedNames.length === 0) {
            alert('有効な名前がありませんでした。');
            return;
        }

        // Add to existing members or replace? 
        // Based on "Add to list" button name, maybe append? 
        // But the CSV logic replaces. Let's replace for consistency or ask user.
        // Assuming replace mode like CSV for now to simple "set members".
        // Or if we want to combine, we should concatenation. 
        // Let's replace to keep it simple state management.
        members = extractedNames;
        updateUIWithMembers();
    }

    function handleFile(file) {
        if (!file.name.endsWith('.csv')) {
            alert('CSVファイルを選択してください。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            processCSV(text);
        };
        reader.readAsText(file);
    }

    function processCSV(text) {
        // Simple but robust CSV parser handling quotes
        const lines = text.split(/\r\n|\n/);
        const extractedNames = [];

        // Skip header (index 0) if it looks like a header
        // We start from index 1 usually.
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);

            // Expected format: No(0), Type(1), Name(2), ...
            if (cols.length > 2) {
                let rawName = cols[2];
                // Remove surrounding quotes if parser didn't already (custom parser below handles it)
                // Actually parseCSVLine should handle quotes.

                // Extract name before @ or ＠
                // Also handle cases where name might be empty
                if (!rawName) continue;

                let name = rawName.split(/[@＠]/)[0].trim();

                if (name) {
                    extractedNames.push(name);
                }
            }
        }

        if (extractedNames.length === 0) {
            alert('有効な名前が見つかりませんでした。CSVの形式を確認してください。');
            return;
        }

        members = extractedNames;
        updateUIWithMembers();
    }

    function parseCSVLine(text) {
        // Handle quoted fields with commas
        const result = [];
        let start = 0;
        let insideQuote = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                let field = text.substring(start, i);
                // Remove surrounding quotes and unexpected spaces
                field = field.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                result.push(field);
                start = i + 1;
            }
        }
        // Last field
        let lastField = text.substring(start);
        lastField = lastField.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        result.push(lastField);

        return result;
    }

    function updateUIWithMembers() {
        memberList.innerHTML = '';
        memberCountSpan.textContent = members.length;

        members.forEach((name, index) => {
            const chip = document.createElement('div');
            chip.className = 'member-chip';
            chip.textContent = name;
            chip.title = 'クリックして名前を編集';
            chip.onclick = () => openEditModal(index);
            memberList.appendChild(chip);
        });

        previewSection.classList.remove('hidden');
        settingsSection.classList.remove('hidden');

        // Ensure execute button is visible/active (if we added disabled state later)
        // Auto-scroll to settings
        // settingsSection.scrollIntoView({ behavior: 'smooth' }); // This might be annoying if typing manually, but okay for test data
    }

    // --- Edit Modal Logic ---
    function openEditModal(index) {
        const currentName = members[index];

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'modal';

        const title = document.createElement('h3');
        title.textContent = '名前を編集';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'modal-buttons';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.className = 'secondary-btn';
        cancelBtn.onclick = () => document.body.removeChild(overlay);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.className = 'primary-btn';
        saveBtn.onclick = () => {
            const newName = input.value.trim();
            if (newName) {
                members[index] = newName;
                updateUIWithMembers();
                document.body.removeChild(overlay);
            } else {
                alert('名前を入力してください。');
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') saveBtn.click();
        };

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(saveBtn);
        modal.appendChild(title);
        modal.appendChild(input);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        setTimeout(() => input.focus(), 50);

        overlay.onclick = (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        };
    }

    function generateGroupings(memberList, numGroups, numRounds) {
        // Track pair history: counts how many times member A and B have been together
        // Key: "NameA|NameB" (sorted), Value: count
        const pairHistory = new Map();

        const getPairKey = (a, b) => [a, b].sort().join('|');
        const incrementPair = (a, b) => {
            const key = getPairKey(a, b);
            pairHistory.set(key, (pairHistory.get(key) || 0) + 1);
        };
        const getPairCount = (a, b) => pairHistory.get(getPairKey(a, b)) || 0;

        const allRounds = [];

        for (let r = 0; r < numRounds; r++) {
            // Shuffle members for randomness foundation
            let currentMembers = [...memberList];

            // Simple shuffle
            for (let i = currentMembers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentMembers[i], currentMembers[j]] = [currentMembers[j], currentMembers[i]];
            }

            // Ideal group size
            const groups = Array.from({ length: numGroups }, () => []);

            // Distribute members trying to minimize overlap cost
            // This is a greedy approach
            // We could use Simulated Annealing for better results but Greedy is usually okay for simple web tools

            // Sort members? Or just process in random order?
            // Random order is already done by shuffle.

            for (const member of currentMembers) {
                // Find best group for this member
                let bestGroupIndex = -1;
                let minCost = Infinity;
                let minSize = Infinity;

                // We also want to balance group sizes.
                // Current expected max size for a group
                // We should fill groups evenly. 
                // Let's refine the greedy strategy:
                // Sort groups by size (ascending), then pick best among the smallest available.

                // Find groups with minimum current size
                let minGroupSize = Math.min(...groups.map(g => g.length));
                let candidateIndices = groups
                    .map((g, i) => ({ size: g.length, index: i }))
                    .filter(g => g.size === minGroupSize)
                    .map(g => g.index);

                // From candidates, pick one that adds least "pair cost"
                let bestCandidate = -1;
                let bestCandidateCost = Infinity;

                // Shuffle candidates to break ties randomly
                candidateIndices.sort(() => Math.random() - 0.5);

                for (const idx of candidateIndices) {
                    const group = groups[idx];
                    let cost = 0;
                    for (const existingMember of group) {
                        cost += getPairCount(member, existingMember);
                        // Add heavy penalty for very recent repeated pairs?
                        // Simple count is usually enough.
                        // Can add exponential weight: Math.pow(count, 2)
                        cost += Math.pow(getPairCount(member, existingMember), 2);
                    }

                    if (cost < bestCandidateCost) {
                        bestCandidateCost = cost;
                        bestCandidate = idx;
                    }
                }

                groups[bestCandidate].push(member);
            }

            // Record this round's pairs
            for (const group of groups) {
                for (let i = 0; i < group.length; i++) {
                    for (let j = i + 1; j < group.length; j++) {
                        incrementPair(group[i], group[j]);
                    }
                }
            }

            allRounds.push(groups);
        }

        return allRounds;
    }

    function renderResults(rounds) {
        resultContainer.innerHTML = '';

        rounds.forEach((groups, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round-block';

            const title = document.createElement('h3');
            title.className = 'round-title';
            title.textContent = `${roundIndex + 1} 回目`;
            roundDiv.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'groups-grid';

            groups.forEach((group, groupIndex) => {
                const card = document.createElement('div');
                card.className = 'group-card';

                const groupName = document.createElement('div');
                groupName.className = 'group-name';
                groupName.textContent = `Group ${String.fromCharCode(65 + groupIndex)}`; // A, B, C...
                card.appendChild(groupName);

                const list = document.createElement('ul');
                list.className = 'group-members';

                group.forEach(member => {
                    const li = document.createElement('li');
                    li.textContent = member;
                    list.appendChild(li);
                });

                card.appendChild(list);
                grid.appendChild(card);
            });

            roundDiv.appendChild(grid);
            resultContainer.appendChild(roundDiv);
        });

        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function generateResultText() {
        let text = "";
        const rounds = document.querySelectorAll('.round-block');

        rounds.forEach((round) => {
            const title = round.querySelector('.round-title').textContent;
            text += `【${title}】\n`;

            const cards = round.querySelectorAll('.group-card');
            cards.forEach(card => {
                const groupName = card.querySelector('.group-name').textContent;
                const members = Array.from(card.querySelectorAll('li')).map(li => li.textContent).join(', ');
                text += `${groupName}: ${members}\n`;
            });
            text += '\n';
        });

        return text;
    }
});
