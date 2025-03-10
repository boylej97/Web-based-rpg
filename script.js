const rpData = {
    gta: {
        servers: {
            "MomentsRP": [{name:"Viktor Reznov", story:"Legendary criminal from Glasgow."}],
            "Scora Network": [{name:"Vinnie Boyle", story:"Funny gangster."}],
            "Prodigy RP": [{name:"Reece Dempsey", story:"Community-oriented citizen."}]
        }
    },
    rdr: {
        servers: {
            "Syn County": [{name:'Jack "Dusty" Roberts', story:"Emerging storyteller in the wild west."}]
        }
    }
};

const container = document.getElementById('rp-container');
const backBtn = document.getElementById('backBtn');
let history = [];

function renderCards(items) {
    container.style.opacity = 0;
    setTimeout(() => {
        container.innerHTML = '';
        items.forEach(i => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${i.name}</h3>`;
            card.onclick = i.onclick;
            container.appendChild(card);
        });
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = 1;
    }, 200);
    backBtn.style.display = history.length ? 'inline-block' : 'none';
}

function showRPs() {
    history = [];
    renderCards([
        {name:'GTA V RP', onclick:()=>showServers('gta')},
        {name:'Red Dead RP', onclick:()=>showServers('rdr')}
    ]);
}

function showServers(type) {
    history.push(showRPs);
    renderCards(Object.keys(rpData[type].servers).map(server => ({
        name: server,
        onclick: () => showCharacters(type, server)
    })));
}

function showCharacters(type, server) {
    history.push(() => showServers(type));
    renderCards(rpData[type].servers[server].map(char => ({
        name: char.name,
        onclick: () => showStory(char, type, server)
    })));
}

function showStory(char, type, server) {
    history.push(() => showCharacters(type, server));
    container.style.opacity = 0;
    setTimeout(() => {
        container.innerHTML = `
            <div class="card">
                <h3>${char.name}</h3>
                <p>${char.story}</p>
            </div>`;
        container.style.opacity = 1;
    }, 200);
    backBtn.style.display = 'inline-block';
}

function goBack() {
    if (history.length) {
        history.pop()();
    }
}

document.addEventListener('DOMContentLoaded', showRPs);