// Odd Question Out - Party Game

let allQuestions = [];
let filteredQuestions = [];
let packs = {};
let selectedPacks = new Set(['kids', 'family']);
let players = [];
let gameState = {
    majorityQuestion: '',
    oddQuestion: '',
    oddPlayerIndex: -1,
    answers: {},
    votes: {},
    currentAnsweringPlayer: -1
};

// Load questions
fetch('questions.json')
    .then(r => r.json())
    .then(data => {
        allQuestions = data.questions;
        packs = data.packs || {};
        renderPackOptions();
        filterQuestions();
    })
    .catch(() => {
        // Fallback
        allQuestions = [
            { q1: "What's your favorite food?", q2: "What food do you hate?", pack: "kids" }
        ];
        packs = { kids: '👶 Kids Friendly' };
        renderPackOptions();
        filterQuestions();
    });

function renderPackOptions() {
    const container = document.getElementById('packOptions');
    if (!container) return;
    
    container.innerHTML = Object.entries(packs).map(([key, label]) => `
        <label class="pack-option">
            <input type="checkbox" value="${key}" ${selectedPacks.has(key) ? 'checked' : ''} onchange="togglePack('${key}')">
            ${label}
        </label>
    `).join('');
}

function togglePack(packKey) {
    if (selectedPacks.has(packKey)) {
        selectedPacks.delete(packKey);
    } else {
        selectedPacks.add(packKey);
    }
    filterQuestions();
}

function filterQuestions() {
    filteredQuestions = allQuestions.filter(q => selectedPacks.has(q.pack));
    updateStartButton();
}

window.togglePack = togglePack;

// DOM Elements
const screens = {
    setup: document.getElementById('setup'),
    answer: document.getElementById('answer'),
    question: document.getElementById('question'),
    answers: document.getElementById('answers'),
    vote: document.getElementById('vote'),
    results: document.getElementById('results')
};

// Setup elements
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayer');
const playerList = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGame');

// Answer selection elements
const playerButtonsEl = document.getElementById('playerButtons');
const showAnswersBtn = document.getElementById('showAnswers');

// Question entry elements
const answeringPlayerEl = document.getElementById('answeringPlayer');
const questionHiddenEl = document.getElementById('questionHidden');
const questionVisibleEl = document.getElementById('questionVisible');
const showQuestionBtn = document.getElementById('showQuestion');
const questionDisplayEl = document.getElementById('questionDisplay');
const answerInput = document.getElementById('answerInput');
const charCountEl = document.getElementById('charCount');
const submitAnswerBtn = document.getElementById('submitAnswer');

// Answers reveal elements
const questionRevealEl = document.getElementById('questionReveal');
const answersListEl = document.getElementById('answersList');
const startVoteBtn = document.getElementById('startVote');

// Vote elements
const votePlayersEl = document.getElementById('votePlayers');
const confirmVoteBtn = document.getElementById('confirmVote');

// Results elements
const resultTitleEl = document.getElementById('resultTitle');
const revealQuestionsEl = document.getElementById('revealQuestions');
const voteResultsEl = document.getElementById('voteResults');
const newRoundBtn = document.getElementById('newRound');
const playAgainBtn = document.getElementById('playAgain');

// Helper functions
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function updateStartButton() {
    const btn = document.getElementById('startGame');
    if (players.length < 3) {
        btn.disabled = true;
        btn.textContent = `Start Game (${3 - players.length} more needed)`;
    } else if (filteredQuestions.length === 0) {
        btn.disabled = true;
        btn.textContent = 'Select at least one category!';
    } else {
        btn.disabled = false;
        btn.textContent = `Start Game (${players.length} players)`;
    }
}

function updatePlayerList() {
    playerList.innerHTML = players.map((p, i) => `
        <li>
            ${p.name}
            <button onclick="removePlayer(${i})">✕</button>
        </li>
    `).join('');
    updateStartButton();
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

function addPlayer() {
    const name = playerNameInput.value.trim();
    if (name && !players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        players.push({ name, question: null, answer: '' });
        playerNameInput.value = '';
        updatePlayerList();
    }
    playerNameInput.focus();
}

function assignQuestions() {
    if (filteredQuestions.length === 0) {
        alert('No questions available! Select at least one category.');
        return false;
    }
    
    // Pick a random question pair
    const pair = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    
    // Randomly decide which question is majority vs odd
    if (Math.random() > 0.5) {
        gameState.majorityQuestion = pair.q1;
        gameState.oddQuestion = pair.q2;
    } else {
        gameState.majorityQuestion = pair.q2;
        gameState.oddQuestion = pair.q1;
    }
    
    // Pick one player to be the odd one out
    gameState.oddPlayerIndex = Math.floor(Math.random() * players.length);
    
    // Assign questions
    players.forEach((p, i) => {
        p.question = (i === gameState.oddPlayerIndex) ? gameState.oddQuestion : gameState.majorityQuestion;
        p.answer = '';
    });
    
    gameState.answers = {};
    gameState.votes = {};
    return true;
}

function renderPlayerButtons() {
    playerButtonsEl.innerHTML = players.map((p, i) => `
        <button class="player-btn ${p.answer ? 'done' : ''}" 
                onclick="startAnswering(${i})" 
                ${p.answer ? 'disabled' : ''}>
            ${p.name}
        </button>
    `).join('');
    
    const allDone = players.every(p => p.answer);
    showAnswersBtn.disabled = !allDone;
}

function startAnswering(index) {
    gameState.currentAnsweringPlayer = index;
    answeringPlayerEl.textContent = players[index].name;
    questionHiddenEl.classList.remove('hidden');
    questionVisibleEl.classList.add('hidden');
    answerInput.value = '';
    charCountEl.textContent = '0';
    showScreen('question');
}

function renderAnswers() {
    // Show the majority question
    questionRevealEl.innerHTML = `
        <div class="label">The Question:</div>
        <div class="question">${gameState.majorityQuestion}</div>
    `;
    
    // Shuffle answers for display
    const shuffled = shuffle(players.map((p, i) => ({ ...p, index: i })));
    
    answersListEl.innerHTML = shuffled.map(p => `
        <div class="answer-card">
            <div class="player">${p.name}</div>
            <div class="text">"${p.answer || '(no answer)'}"</div>
        </div>
    `).join('');
}

function renderAnswersWithVoting() {
    gameState.votes = {};
    
    // Show the majority question
    questionRevealEl.innerHTML = `
        <div class="label">The Question:</div>
        <div class="question">${gameState.majorityQuestion}</div>
    `;
    
    // Shuffle answers for display with voting
    const shuffled = shuffle(players.map((p, i) => ({ ...p, index: i })));
    
    answersListEl.innerHTML = `
        <div class="vote-instructions">🗳️ Tap to vote for who had a different question!</div>
        <div class="vote-counter" id="voteCounter">Votes: 0 / ${players.length}</div>
        ${shuffled.map(p => `
            <div class="answer-card voteable" data-index="${p.index}" onclick="toggleVote(${p.index})">
                <div class="player">${p.name} <span class="vote-badge" id="badge-${p.index}"></span></div>
                <div class="text">"${p.answer || '(no answer)'}"</div>
            </div>
        `).join('')}
    `;
    
    // Hide the old "Start Voting" button, show "See Results"
    if (startVoteBtn) startVoteBtn.style.display = 'none';
    if (confirmVoteBtn) {
        confirmVoteBtn.style.display = 'block';
        // Move confirm button to answers screen
        answersListEl.appendChild(confirmVoteBtn);
    }
}

function toggleVote(index) {
    const totalVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
    
    if (gameState.votes[index]) {
        // Remove vote
        delete gameState.votes[index];
    } else if (totalVotes < players.length) {
        // Add vote (only if we have votes left)
        gameState.votes[index] = (gameState.votes[index] || 0) + 1;
    }
    
    updateVoteBadges();
}

function updateVoteBadges() {
    const totalVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
    document.getElementById('voteCounter').textContent = `Votes: ${totalVotes} / ${players.length}`;
    
    document.querySelectorAll('.answer-card.voteable').forEach(card => {
        const idx = parseInt(card.dataset.index);
        const count = gameState.votes[idx] || 0;
        const badge = document.getElementById(`badge-${idx}`);
        if (badge) badge.textContent = count > 0 ? `👆 ${count}` : '';
        card.classList.toggle('voted', count > 0);
    });
}

window.toggleVote = toggleVote;

function renderVotePlayers() {
    gameState.votes = {};
    
    votePlayersEl.innerHTML = `
        <div class="vote-counter" id="voteCounter">Votes: 0 / ${players.length}</div>
        <p class="vote-instructions">Each player votes for who they think had a different question.</p>
        ${players.map((p, i) => `
            <div class="player-card" data-index="${i}">
                <span class="name">${p.name}</span>
                <div class="vote-controls">
                    <button class="vote-btn minus" onclick="removeVote(${i})">➖</button>
                    <span class="vote-count" id="votes-${i}"></span>
                    <button class="vote-btn plus" onclick="addVote(${i})">➕</button>
                </div>
            </div>
        `).join('')}
    `;
}

function addVote(index) {
    const totalVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
    if (totalVotes >= players.length) return;
    
    gameState.votes[index] = (gameState.votes[index] || 0) + 1;
    updateVoteDisplay();
}

function removeVote(index) {
    if (gameState.votes[index] && gameState.votes[index] > 0) {
        gameState.votes[index]--;
        if (gameState.votes[index] === 0) delete gameState.votes[index];
    }
    updateVoteDisplay();
}

function updateVoteDisplay() {
    const totalVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
    document.getElementById('voteCounter').textContent = `Votes: ${totalVotes} / ${players.length}`;
    
    document.querySelectorAll('#votePlayers .player-card').forEach(card => {
        const idx = parseInt(card.dataset.index);
        const count = gameState.votes[idx] || 0;
        document.getElementById(`votes-${idx}`).textContent = count > 0 ? `👆 ${count}` : '';
        card.classList.toggle('voted', count > 0);
    });
}

function showResults() {
    // Find who got most votes
    let maxVotes = 0;
    let mostVoted = -1;
    for (const [idx, votes] of Object.entries(gameState.votes)) {
        if (votes > maxVotes) {
            maxVotes = votes;
            mostVoted = parseInt(idx);
        }
    }
    
    const foundOddOne = mostVoted === gameState.oddPlayerIndex;
    const oddPlayer = players[gameState.oddPlayerIndex];
    
    resultTitleEl.textContent = foundOddOne ? '🎉 Majority Wins!' : '🕵️ Odd One Out Wins!';
    
    revealQuestionsEl.innerHTML = `
        <div class="majority">
            <div class="label">Majority Question:</div>
            <div class="question">${gameState.majorityQuestion}</div>
        </div>
        <div class="oddone">
            <div class="label">${oddPlayer.name}'s Question:</div>
            <div class="question">${gameState.oddQuestion}</div>
        </div>
    `;
    
    // Show vote breakdown
    const sortedPlayers = [...players].map((p, i) => ({ ...p, index: i, votes: gameState.votes[i] || 0 }))
        .sort((a, b) => b.votes - a.votes);
    
    voteResultsEl.innerHTML = sortedPlayers.map(p => {
        const isOdd = p.index === gameState.oddPlayerIndex;
        const isTopVoted = p.votes === maxVotes && maxVotes > 0;
        let classes = 'result-row';
        if (isOdd) classes += ' oddone';
        else if (isTopVoted && foundOddOne) classes += ' winner';
        
        return `
            <div class="${classes}">
                <span class="name">${p.name} ${isOdd ? '🕵️' : ''}</span>
                <span class="votes">${p.votes} vote${p.votes !== 1 ? 's' : ''}</span>
            </div>
        `;
    }).join('');
    
    showScreen('results');
}

// Event Listeners
addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addPlayer();
});

startGameBtn.addEventListener('click', () => {
    saveLastPlayers();
    if (!assignQuestions()) return;
    renderPlayerButtons();
    showScreen('answer');
});

showQuestionBtn.addEventListener('click', () => {
    const player = players[gameState.currentAnsweringPlayer];
    questionHiddenEl.classList.add('hidden');
    questionVisibleEl.classList.remove('hidden');
    questionDisplayEl.textContent = player.question;
});

answerInput.addEventListener('input', () => {
    charCountEl.textContent = answerInput.value.length;
});

submitAnswerBtn.addEventListener('click', () => {
    const answer = answerInput.value.trim();
    if (!answer) {
        alert('Please enter an answer!');
        return;
    }
    
    players[gameState.currentAnsweringPlayer].answer = answer;
    renderPlayerButtons();
    showScreen('answer');
});

showAnswersBtn.addEventListener('click', () => {
    renderAnswersWithVoting();
    showScreen('answers');
});

confirmVoteBtn.addEventListener('click', () => {
    const totalVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
    if (totalVotes === 0) {
        alert('Cast at least one vote!');
        return;
    }
    showResults();
});

newRoundBtn.addEventListener('click', () => {
    players.forEach(p => {
        p.question = null;
        p.answer = '';
    });
    gameState = {
        majorityQuestion: '',
        oddQuestion: '',
        oddPlayerIndex: -1,
        answers: {},
        votes: {},
        currentAnsweringPlayer: -1
    };
    if (!assignQuestions()) {
        showScreen('setup');
        return;
    }
    renderPlayerButtons();
    showScreen('answer');
});

playAgainBtn.addEventListener('click', () => {
    players = [];
    gameState = {
        majorityQuestion: '',
        oddQuestion: '',
        oddPlayerIndex: -1,
        answers: {},
        votes: {},
        currentAnsweringPlayer: -1
    };
    updatePlayerList();
    showScreen('setup');
});

// ═══════════════════════════════════════════════════════════════════
// AUTO-SAVE LAST PLAYERS
// ═══════════════════════════════════════════════════════════════════
const LAST_PLAYERS_KEY = 'oddquestion_last_players';

function saveLastPlayers() {
    if (players.length >= 3) {
        localStorage.setItem(LAST_PLAYERS_KEY, JSON.stringify(players.map(p => p.name)));
    }
}

function loadLastPlayers() {
    try {
        const saved = JSON.parse(localStorage.getItem(LAST_PLAYERS_KEY));
        if (saved && saved.length >= 3) {
            players = saved.map(name => ({ name, question: null, answer: '' }));
            updatePlayerList();
        }
    } catch {}
}

document.getElementById('clearPlayers')?.addEventListener('click', () => {
    players = [];
    localStorage.removeItem(LAST_PLAYERS_KEY);
    updatePlayerList();
});

loadLastPlayers();

// ═══════════════════════════════════════════════════════════════════
// TEAM SAVE/LOAD
// ═══════════════════════════════════════════════════════════════════
const TEAMS_KEY = 'partygames_saved_teams';

function getSavedTeams() {
    try {
        return JSON.parse(localStorage.getItem(TEAMS_KEY)) || {};
    } catch { return {}; }
}

function saveTeamsToStorage(teams) {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

function renderSavedTeams() {
    const teams = getSavedTeams();
    const select = document.getElementById('savedTeams');
    const teamNames = Object.keys(teams);
    
    select.innerHTML = '<option value="">📂 Load a saved team...</option>' +
        teamNames.map(name => `<option value="${name}">${name} (${teams[name].length})</option>`).join('');
    
    document.getElementById('savedTeamsSection').style.display = teamNames.length > 0 ? 'flex' : 'none';
}

function saveCurrentTeam() {
    const nameInput = document.getElementById('teamName');
    const teamName = nameInput.value.trim();
    
    if (!teamName) { alert('Enter a team name'); return; }
    if (players.length < 2) { alert('Add at least 2 players first'); return; }
    
    const teams = getSavedTeams();
    teams[teamName] = players.map(p => p.name);
    saveTeamsToStorage(teams);
    nameInput.value = '';
    renderSavedTeams();
}

function loadTeam(teamName) {
    if (!teamName) return;
    const teams = getSavedTeams();
    const teamPlayers = teams[teamName];
    if (teamPlayers) {
        players = teamPlayers.map(name => ({ name, question: null, answer: '' }));
        updatePlayerList();
    }
    document.getElementById('savedTeams').value = '';
}

function deleteSelectedTeam() {
    const select = document.getElementById('savedTeams');
    const teamName = select.value;
    if (!teamName) { alert('Select a team to delete'); return; }
    if (confirm(`Delete team "${teamName}"?`)) {
        const teams = getSavedTeams();
        delete teams[teamName];
        saveTeamsToStorage(teams);
        renderSavedTeams();
    }
}

document.getElementById('savedTeams')?.addEventListener('change', e => loadTeam(e.target.value));
document.getElementById('saveTeam')?.addEventListener('click', saveCurrentTeam);
document.getElementById('deleteTeam')?.addEventListener('click', deleteSelectedTeam);
document.getElementById('teamName')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') saveCurrentTeam();
});

// Show buttons when players exist
const origUpdatePlayerList = updatePlayerList;
updatePlayerList = function() {
    origUpdatePlayerList();
    const saveSection = document.getElementById('saveTeamSection');
    const clearBtn = document.getElementById('clearPlayers');
    if (saveSection) saveSection.style.display = players.length >= 2 ? 'flex' : 'none';
    if (clearBtn) clearBtn.style.display = players.length > 0 ? 'block' : 'none';
};

renderSavedTeams();

// Globals
window.removePlayer = removePlayer;
window.addVote = addVote;
window.removeVote = removeVote;
window.loadTeam = loadTeam;
window.startAnswering = startAnswering;
