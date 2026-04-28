// 1. კონფიგურაცია
const MATCHES_API = 'https://localhost:7053/api/Sports/live';
const STANDINGS_API = 'https://localhost:7053/api/Standings';
const SCORERS_API = 'https://localhost:7053/api/Standings/Scorers'; // ახალი ენდპოინტი

let allMatches = [];
let liveVisibleCount = 6; // ლაივების საწყისი რაოდენობა

// --- მატჩების ჩატვირთვა ---
async function loadMatches() {
    try {
        const response = await fetch(MATCHES_API);
        allMatches = await response.json();
        renderFootballPage(); 
    } catch (e) { 
        console.error("Matches Load Error:", e); 
    }
}

// --- გვერდის რენდერი ---
function renderFootballPage() {
    const liveList = document.getElementById('fb-live-list');
    const schedList = document.getElementById('fb-schedule-list');
    
    if(!liveList || !schedList) return;

    const liveMatches = allMatches.filter(m => m.status === 1);
    const scheduledMatches = allMatches.filter(m => m.status !== 1 && m.status !== 2);

    const visibleLive = liveMatches.slice(0, liveVisibleCount);
    liveList.innerHTML = visibleLive.length > 0 
        ? visibleLive.map(m => createMatchHTML(m, true)).join('') 
        : `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #555;">ამ წამს აქტიური ლაივ მატჩები არ არის</div>`;

    handleSeeMoreButton('live-btn-wrapper', liveMatches.length, liveVisibleCount, () => {
        liveVisibleCount += 6;
        renderFootballPage();
    });

    schedList.innerHTML = scheduledMatches.length > 0 
        ? scheduledMatches.slice(0, 15).map(m => createMatchHTML(m, false)).join('') 
        : `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #555;">განრიგი ცარიელია</div>`;
}

// --- მატჩის ბარათის HTML ---
function createMatchHTML(match, isLive) {
    const placeholder = 'https://img.icons8.com/ios-filled/100/ffffff/football2.png';
    let statusText = "";
    
    if (isLive) {
        const currentMinute = match.minute || match.elapsed || match.timeMinute || match.statusMinute;
        statusText = `<span class="live-tag">🔴 ${currentMinute ? currentMinute + "'" : 'LIVE'}</span>`;
    } else {
        let matchTime = "--:--";
        const rawDate = match.utcDate || match.date || match.dateTime || match.startTime;
        if (rawDate) {
            const dateString = (typeof rawDate === 'string' && !rawDate.endsWith('Z')) ? rawDate + 'Z' : rawDate;
            const dateObj = new Date(dateString);
            if (!isNaN(dateObj.getTime())) {
                matchTime = dateObj.toLocaleTimeString('ka-GE', { 
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tbilisi' 
                });
            }
        }
        statusText = `<span class="match-start-time">🕒 ${matchTime}</span>`;
    }

    const showScore = isLive || match.status === 2 || match.status === 'FINISHED';
    let hScore = "-", aScore = "-";
    if (showScore && match.score) {
        const parts = String(match.score).split('-');
        hScore = parts[0] ? parts[0].trim() : "0";
        aScore = parts[1] ? parts[1].trim() : "0";
    }

    return `
        <div class="fb-match-card ${isLive ? 'is-live' : ''}">
            <div class="status-bar">
                <span>${match.league?.name || match.competition?.name || 'ფეხბურთი'}</span>
                ${statusText}
            </div>
            <div class="team-row">
                <div class="team-info">
                    <img src="${match.homeTeam?.logoUrl || match.homeTeam?.crest || placeholder}" onerror="this.src='${placeholder}'">
                    <span>${match.homeTeam?.name || 'გუნდი 1'}</span>
                </div>
                <div class="score-box">${hScore}</div>
            </div>
            <div class="team-row">
                <div class="team-info">
                    <img src="${match.awayTeam?.logoUrl || match.awayTeam?.crest || placeholder}" onerror="this.src='${placeholder}'">
                    <span>${match.awayTeam?.name || 'გუნდი 2'}</span>
                </div>
                <div class="score-box">${aScore}</div>
            </div>
        </div>`;
}

// --- ტოპ ბომბარდირების ჩატვირთვა ---
async function loadTopScorers(leagueCode) {
    const scorersList = document.getElementById('scorers-list');
    if (!scorersList) return;

    scorersList.innerHTML = '<p style="text-align:center; padding:10px;">...</p>';

    try {
        const response = await fetch(`${SCORERS_API}/${leagueCode}`);
        const scorers = await response.json();

        if (!scorers || scorers.length === 0) {
            scorersList.innerHTML = '<p style="text-align:center; padding:10px;">მონაცემები არ არის</p>';
            return;
        }

        // ბექენდიდან მოდის: PlayerName, TeamName, Goals
        scorersList.innerHTML = scorers.slice(0, 5).map((player, index) => `
            <div class="scorer-item">
                <div class="player-info">
                    <span class="rank">${index + 1}</span>
                    <div class="player-details">
                        <span class="player-name">${player.playerName}</span>
                        <span class="player-team">${player.teamName}</span>
                    </div>
                </div>
                <div class="goals-count">
                    <strong>${player.goals}</strong> ⚽
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Scorers Load Error:", e);
        scorersList.innerHTML = '<p>შეცდომა</p>';
    }
}

// --- See More ღილაკის მართვის ფუნქცია ---
function handleSeeMoreButton(wrapperId, totalCount, currentVisible, onClickAction) {
    let wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    wrapper.innerHTML = '';
    if (totalCount > currentVisible) {
        const btn = document.createElement('button');
        btn.innerText = 'SEE MORE';
        btn.className = 'see-more-style';
        btn.onclick = onClickAction;
        wrapper.appendChild(btn);
    }
}

// --- სატურნირო ცხრილის ჩატვირთვა ---
async function loadStandings(leagueCode) {
    const tableBody = document.getElementById('standings-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">იტვირთება...</td></tr>';

    try {
        const response = await fetch(`${STANDINGS_API}/${leagueCode}`);
        const standings = await response.json();
        
        tableBody.innerHTML = standings.map(item => `
            <tr>
                <td>${item.position}</td>
                <td>
                    <div class="team-cell" style="display: flex; align-items: center; gap: 10px;">
                        <img src="${item.teamLogo || item.teamCrest || ''}" width="25" onerror="this.src='https://via.placeholder.com/25'">
                        <span>${item.teamName}</span>
                    </div>
                </td>
                <td>${item.played}</td>
                <td>${item.won}</td>
                <td>${item.draw}</td>
                <td>${item.lost}</td>
                <td><strong style="color: #00ff85;">${item.points}</strong></td>
            </tr>`).join('');
    } catch (e) { 
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">მონაცემები არ არის ბაზაში.</td></tr>'; 
    }
}

// --- ლიგის გადართვა (ახლა უკვე ბომბარდირებსაც ცვლის) ---
function changeLeague(code) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    loadStandings(code);
    loadTopScorers(code); // აი აქ დაემატა
}

// --- ინიციალიზაცია ---
document.addEventListener('DOMContentLoaded', () => {
    loadMatches();
    loadStandings('PL');
    loadTopScorers('PL'); // პირველი ჩატვირთვა

    const tableSeeMore = document.getElementById('seeMoreBtn');
    const tableWrapper = document.getElementById('tableWrapper');

    if (tableSeeMore && tableWrapper) {
        tableSeeMore.addEventListener('click', () => {
            tableWrapper.classList.toggle('expanded');
            tableSeeMore.innerText = tableWrapper.classList.contains('expanded') ? 'SHOW LESS' : 'SEE MORE';
        });
    }
});

setInterval(loadMatches, 30000); 
