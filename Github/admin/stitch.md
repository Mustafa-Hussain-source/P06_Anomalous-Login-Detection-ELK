<!-- Design System -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SENTINEL_ETHOS | ALDS Console</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        @keyframes pulse-ring {
            0% { transform: scale(0.33); opacity: 1; }
            80%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .pulse-indicator {
            position: relative;
            display: inline-flex;
            height: 8px;
            width: 8px;
            border-radius: 50%;
            background-color: #ff516a;
        }
        .pulse-ring {
            content: "";
            position: absolute;
            width: 24px;
            height: 24px;
            background-color: #ff516a;
            border-radius: 50%;
            animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            left: -8px;
            top: -8px;
        }
        .glass-panel {
            background: rgba(19, 27, 46, 0.6);
            backdrop-filter: blur(12px);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2d3449;
            border-radius: 2px;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "surface-container-low": "#131b2e",
                "on-background": "#dae2fd",
                "surface-container": "#171f33",
                "primary-fixed-dim": "#c0c1ff",
                "outline": "#908fa0",
                "primary-container": "#8083ff",
                "tertiary-fixed": "#ffdadb",
                "surface-tint": "#c0c1ff",
                "surface-container-highest": "#2d3449",
                "inverse-surface": "#dae2fd",
                "on-tertiary-fixed": "#40000d",
                "surface-variant": "#2d3449",
                "secondary-fixed": "#c9e6ff",
                "secondary": "#89ceff",
                "on-primary-fixed": "#07006c",
                "surface-container-lowest": "#060e20",
                "on-tertiary-container": "#5b0017",
                "error": "#ffb4ab",
                "on-secondary-container": "#00344e",
                "inverse-on-surface": "#283044",
                "on-primary-fixed-variant": "#2f2ebe",
                "on-primary": "#1000a9",
                "on-tertiary-fixed-variant": "#92002a",
                "surface": "#0b1326",
                "primary": "#c0c1ff",
                "error-container": "#93000a",
                "on-surface": "#dae2fd",
                "on-primary-container": "#0d0096",
                "tertiary-container": "#ff516a",
                "on-secondary-fixed-variant": "#004c6e",
                "outline-variant": "#464554",
                "on-tertiary": "#67001b",
                "inverse-primary": "#494bd6",
                "tertiary-fixed-dim": "#ffb2b7",
                "on-secondary": "#00344d",
                "surface-dim": "#0b1326",
                "primary-fixed": "#e1e0ff",
                "tertiary": "#ffb2b7",
                "background": "#0b1326",
                "on-error": "#690005",
                "surface-bright": "#31394d",
                "secondary-fixed-dim": "#89ceff",
                "surface-container-high": "#222a3d",
                "on-surface-variant": "#c7c4d7",
                "on-secondary-fixed": "#001e2f",
                "secondary-container": "#00a2e6",
                "on-error-container": "#ffdad6"
              },
              fontFamily: {
                "headline": ["Space Grotesk"],
                "body": ["Inter"],
                "label": ["Inter"],
                "mono": ["JetBrains Mono"]
              },
              borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
            },
          },
        }
    </script>
</head>
<body class="bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen">
<!-- Shared SideNavBar -->
<aside class="h-screen w-20 hover:w-64 fixed left-0 top-0 z-40 transition-all duration-300 overflow-hidden bg-[#131b2e] flex flex-col py-20 group">
<div class="flex flex-col h-full justify-between">
<nav class="flex flex-col gap-2">
<!-- Dashboard is Active -->
<a class="flex items-center px-6 py-4 bg-indigo-500/10 text-indigo-300 border-r-4 border-indigo-500 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4" style="font-variation-settings: 'FILL' 1;">grid_view</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Dashboard</span>
</a>
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">emergency_home</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Anomalies</span>
</a>
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">security</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Mitigation</span>
</a>
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">database</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Evidence</span>
</a>
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">lan</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Network</span>
</a>
</nav>
<div class="flex flex-col gap-2 border-t border-white/5 pt-4">
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">help</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Support</span>
</a>
<a class="flex items-center px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all ease-in-out" href="#">
<span class="material-symbols-outlined mr-4">logout</span>
<span class="font-['JetBrains_Mono'] text-xs font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
</a>
</div>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="pl-20 min-h-screen">
<!-- Header Section -->
<header class="fixed top-0 left-20 right-0 z-30 bg-[#0b1326]/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-8">
<div class="flex flex-col">
<h1 class="font-headline font-bold text-lg text-on-surface tracking-tight">ALDS Sprint 3 + Sprint 4</h1>
<p class="text-xs text-on-surface-variant font-mono tracking-wider">Anomalous Login Detection and Automated Mitigation Console</p>
</div>
<div class="text-[10px] font-mono text-outline uppercase tracking-widest bg-surface-container-lowest px-3 py-1 rounded">
                Backend: <span class="text-primary-fixed-dim">http://localhost:8000</span>
</div>
</header>
<div class="pt-24 px-8 pb-12 space-y-6 max-w-[1600px] mx-auto">
<!-- Top Row (Two Columns) -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<!-- Control Panel (1/3) -->
<section class="bg-surface-container-low p-6 flex flex-col gap-6">
<div class="flex items-center justify-between border-b border-outline-variant/10 pb-4">
<h2 class="font-headline text-sm font-bold uppercase tracking-widest text-primary-fixed-dim flex items-center gap-2">
<span class="material-symbols-outlined text-sm">settings_remote</span>
                            Control Panel
                        </h2>
</div>
<div class="grid grid-cols-1 gap-2">
<button class="w-full text-left px-4 py-2 bg-indigo-900/40 text-indigo-300 text-xs font-mono border-l-2 border-indigo-500 hover:bg-indigo-800/50 transition-colors">RUN UC-012: BRUTE_FORCE_BURST</button>
<button class="w-full text-left px-4 py-2 bg-rose-900/40 text-rose-300 text-xs font-mono border-l-2 border-rose-500 hover:bg-rose-800/50 transition-colors">RUN UC-013: GEO_ANOMALY_JUMP</button>
<button class="w-full text-left px-4 py-2 bg-sky-900/40 text-sky-300 text-xs font-mono border-l-2 border-sky-500 hover:bg-sky-800/50 transition-colors">RUN UC-014: IMPOSSIBLE_TRAVEL</button>
<button class="w-full text-left px-4 py-2 bg-amber-900/40 text-amber-300 text-xs font-mono border-l-2 border-amber-500 hover:bg-amber-800/50 transition-colors">RUN UC-015: CREDENTIAL_STUFFING</button>
<button class="w-full text-left px-4 py-2 bg-fuchsia-900/40 text-fuchsia-300 text-xs font-mono border-l-2 border-fuchsia-500 hover:bg-fuchsia-800/50 transition-colors">RUN UC-016: MALICIOUS_ASN_PROX</button>
<button class="w-full text-left px-4 py-2 bg-cyan-900/40 text-cyan-300 text-xs font-mono border-l-2 border-cyan-500 hover:bg-cyan-800/50 transition-colors">RUN UC-018: SESSION_HIJACK_ATTEMPT</button>
<button class="w-full text-left px-4 py-2 bg-lime-900/40 text-lime-300 text-xs font-mono border-l-2 border-lime-500 hover:bg-lime-800/50 transition-colors">RUN UC-019: MULTI_FACTOR_BYPASS</button>
</div>
<div class="flex flex-col gap-2 mt-4 pt-4 border-t border-outline-variant/10">
<button class="w-full bg-[#10b981] hover:bg-[#059669] text-white font-headline text-xs font-bold uppercase py-3 transition-all active:scale-[0.98]">
                            Start Simulation
                        </button>
<button class="w-full bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant font-headline text-xs font-bold uppercase py-3 transition-all">
                            Reset Simulation
                        </button>
</div>
<div class="mt-auto p-3 bg-surface-container-lowest flex items-center gap-3">
<span class="material-symbols-outlined text-error text-sm">wifi_off</span>
<div class="flex flex-col">
<span class="text-[10px] font-mono text-error font-bold uppercase">System Status</span>
<span class="text-[10px] font-mono text-error">API unreachable: CONNECTION_REFUSED</span>
</div>
</div>
</section>
<!-- Live Login Events (2/3) -->
<section class="lg:col-span-2 bg-surface-container-low overflow-hidden flex flex-col">
<div class="p-6 border-b border-outline-variant/10 flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="relative flex items-center justify-center">
<div class="pulse-ring"></div>
<div class="pulse-indicator"></div>
</div>
<h2 class="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">Live Login Events</h2>
</div>
<div class="flex gap-2">
<div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
<span class="text-[10px] font-mono text-outline uppercase tracking-tighter">Real-time Polling Active</span>
</div>
</div>
<div class="flex-1 overflow-auto custom-scrollbar">
<table class="w-full border-collapse">
<thead>
<tr class="bg-surface-container-lowest sticky top-0">
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Time</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">User</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">IP</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Country</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Action</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Risk</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/5">
<tr class="hover:bg-white/5 transition-colors group">
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:22:01.03</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">admin_main</td>
<td class="px-6 py-4 font-mono text-xs text-secondary">192.168.1.45</td>
<td class="px-6 py-4 font-body text-xs text-on-surface-variant flex items-center gap-2">
<img alt="US" class="w-4 h-3 opacity-80" data-alt="US flag icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuQNn0ZLR2QxKZbqotePkT0v8cosgOcCPxhON32xZ9nq9o4rjbPtsppVKNGbeS0-Pl2TyvpP4NmLhzubnkCl3_I9VCHhiEWPXRhRkw3ygBHFswdDfoTJHZ3iw1IO7m-t-pmYzGZuyVjqlaQKXi76AgxP-DwsFnVkVEfhkZ03ml4uT5E44VM6llXlld7rwNj1kOG8ELIDNryECuSkMVMp03NijSP1dq_TloBXxJvK565T3W3gM5VdnSdPwEK6us5tXV9_jNJXVUexE"/>
                                        USA
                                    </td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">LOGIN_SUCCESS</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-[10px] font-bold uppercase">Safe</span>
</td>
</tr>
<tr class="hover:bg-white/5 transition-colors">
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:21:58.42</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">j_smith_dev</td>
<td class="px-6 py-4 font-mono text-xs text-secondary">45.22.119.8</td>
<td class="px-6 py-4 font-body text-xs text-on-surface-variant flex items-center gap-2">
<img alt="RU" class="w-4 h-3 opacity-80" data-alt="Russia flag icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz0Kxzbds9v7H9wmB3P3-x2TiU7sDQlSyGxzqP48ZjwFUdH3PRWF-EZSO4933R37A7wA7sSrZGkVD5u7NqGoHUN0w0THVZ1emL8L0VuC3p3T6C2vHEKwNclqqjWVDnfj3uDtcTYDs91a16t9UNlbIn6ahTU8ARbZAzlbNLnMcaGf9zLzj2ERo2ZnrY3VBdDsNAWX-cnl0_M9P3UHHY0tvCAikD_yxgvNzotQmN4-7bitP_BHm-upbRW5L6juCXCqrnsLxbv0uKl30"/>
                                        RUS
                                    </td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">AUTH_FAIL_PASS</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-rose-900/40 text-rose-400 text-[10px] font-bold uppercase">Suspicious</span>
</td>
</tr>
<tr class="hover:bg-white/5 transition-colors">
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:21:44.11</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">system_root</td>
<td class="px-6 py-4 font-mono text-xs text-secondary">10.0.0.12</td>
<td class="px-6 py-4 font-body text-xs text-on-surface-variant flex items-center gap-2">
<img alt="DE" class="w-4 h-3 opacity-80" data-alt="Germany flag icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrk4-EiQpMPa1wIYxO0IUbLbNThx4mp7qE4vnlzSTsNODGG31csTc6nYDNCMuPiTarfykQ3DxTUQUSuRXv0870W2FVG-D3V6HzEZHIpvP6dZHjOiVjDI-1DmBc0LNr6QWjYLvdk_1Bh6jIXDqJa90zO4BlZrTz7oBNUo4fTm1U0-joTtM8cQ6RHqPVVMkTS55fD2WujXdjDCMtXEtsxrtZFP4wF5q5B3bGTxsfi4R2bfY1XJQP4LXq4LTYsJwrdcaCPnng4yvwtfQ"/>
                                        GER
                                    </td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">MFA_REQUEST</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-[10px] font-bold uppercase">Safe</span>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
<!-- Middle Row (Full Width) -->
<section class="bg-surface-container-low overflow-hidden">
<div class="p-6 border-b border-outline-variant/10 flex items-center justify-between">
<h2 class="font-headline text-sm font-bold uppercase tracking-widest text-primary-fixed-dim flex items-center gap-2">
<span class="material-symbols-outlined text-sm">shield_with_heart</span>
                        Mitigation Log
                    </h2>
</div>
<div class="overflow-x-auto">
<table class="w-full border-collapse">
<thead>
<tr class="bg-surface-container-lowest">
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Time</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">UC</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Target</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Action</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Status</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/5">
<tr>
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:21:40.99</td>
<td class="px-6 py-4 font-mono text-xs text-rose-400 font-bold">UC-013</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">j_smith_dev</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">BLOCK_IP_ADDRESS</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
<span class="text-xs text-emerald-400 font-mono">Success</span>
</div>
</td>
</tr>
<tr>
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:20:12.33</td>
<td class="px-6 py-4 font-mono text-xs text-amber-400 font-bold">UC-015</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">global_web_proxy</td>
<td class="px-6 py-4 font-body text-xs text-on-surface">FORCE_MFA_RESET</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
<span class="text-xs text-primary font-mono">Pending</span>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
<!-- Bottom Row (Full Width) -->
<section class="bg-surface-container-low overflow-hidden">
<div class="p-6 border-b border-outline-variant/10 flex items-center justify-between">
<h2 class="font-headline text-sm font-bold uppercase tracking-widest text-primary-fixed-dim flex items-center gap-2">
<span class="material-symbols-outlined text-sm">terminal</span>
                        Sprint-4 Runtime Evidence
                    </h2>
<span class="text-[10px] font-mono text-outline-variant">TOTAL_OBJECTS: 1,294</span>
</div>
<div class="overflow-x-auto">
<table class="w-full border-collapse">
<thead>
<tr class="bg-surface-container-lowest">
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Time</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">UC</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Event</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Action</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Status</th>
<th class="px-6 py-3 text-left font-mono text-[10px] font-bold text-outline uppercase tracking-widest">Details</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/5">
<tr class="group">
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:18:02.00</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">UC-012</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">THRESHOLD_VIOLATION</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">ISOLATE_CREDENTIAL</td>
<td class="px-6 py-4 text-emerald-400 font-mono text-xs">COMMITTED</td>
<td class="px-6 py-4">
<div class="bg-surface-container-lowest p-2 rounded text-[10px] font-mono text-primary-fixed-dim max-w-xs overflow-hidden group-hover:bg-surface-container-highest transition-colors">
                                        { "limit": 10, "observed": 45, "vector": "burst" }
                                    </div>
</td>
</tr>
<tr class="group">
<td class="px-6 py-4 font-mono text-xs text-on-surface-variant">14:15:33.88</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">UC-018</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">SID_MISMATCH</td>
<td class="px-6 py-4 font-mono text-xs text-on-surface">INVALIDATE_SESSION</td>
<td class="px-6 py-4 text-secondary font-mono text-xs">ANALYZING</td>
<td class="px-6 py-4">
<div class="bg-surface-container-lowest p-2 rounded text-[10px] font-mono text-primary-fixed-dim max-w-xs overflow-hidden group-hover:bg-surface-container-highest transition-colors">
                                        { "token_age": "4ms", "fingerprint": "a3f1..e2" }
                                    </div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>
<!-- Background Decorative Elements -->
<div class="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
<div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
<div class="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]"></div>
</div>
</body></html>

<!-- ALDS Sprint 3 + 4 Dashboard -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SENTINEL | Anomalies Overview</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0b1326;
        }
        .font-headline { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .grid-bg {
            background-image: radial-gradient(circle at 2px 2px, rgba(192, 193, 255, 0.05) 1px, transparent 0);
            background-size: 40px 40px;
        }
        
        .pulse-ring {
            position: relative;
        }
        .pulse-ring::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #c0c1ff;
            opacity: 0.4;
            animation: pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(2.5); opacity: 0; }
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "surface-dim": "#0b1326",
                "secondary-fixed": "#c9e6ff",
                "on-secondary-fixed-variant": "#004c6e",
                "tertiary-fixed-dim": "#ffb2b7",
                "primary-fixed": "#e1e0ff",
                "on-tertiary-fixed-variant": "#92002a",
                "secondary": "#89ceff",
                "on-primary-container": "#0d0096",
                "error-container": "#93000a",
                "surface-tint": "#c0c1ff",
                "inverse-surface": "#dae2fd",
                "tertiary-container": "#ff516a",
                "background": "#0b1326",
                "surface": "#0b1326",
                "primary-container": "#8083ff",
                "tertiary-fixed": "#ffdadb",
                "surface-container-lowest": "#060e20",
                "on-secondary-fixed": "#001e2f",
                "on-surface": "#dae2fd",
                "surface-container": "#171f33",
                "secondary-container": "#00a2e6",
                "on-tertiary-container": "#5b0017",
                "on-primary-fixed-variant": "#2f2ebe",
                "outline-variant": "#464554",
                "on-background": "#dae2fd",
                "on-surface-variant": "#c7c4d7",
                "inverse-on-surface": "#283044",
                "inverse-primary": "#494bd6",
                "secondary-fixed-dim": "#89ceff",
                "outline": "#908fa0",
                "surface-bright": "#31394d",
                "primary": "#c0c1ff",
                "on-tertiary": "#67001b",
                "on-error": "#690005",
                "surface-container-high": "#222a3d",
                "surface-container-highest": "#2d3449",
                "primary-fixed-dim": "#c0c1ff",
                "on-secondary-container": "#00344e",
                "on-secondary": "#00344d",
                "tertiary": "#ffb2b7",
                "error": "#ffb4ab",
                "on-primary-fixed": "#07006c",
                "surface-container-low": "#131b2e",
                "on-primary": "#1000a9",
                "surface-variant": "#2d3449",
                "on-tertiary-fixed": "#40000d",
                "on-error-container": "#ffdad6"
              },
              fontFamily: {
                "headline": ["Space Grotesk"],
                "body": ["Inter"],
                "label": ["Inter"]
              },
              borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
            },
          },
        }
    </script>
</head>
<body class="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container grid-bg">
<!-- Top Navigation Shell -->
<nav class="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-md flex justify-between items-center px-6 h-16 w-full shadow-[0_0_32px_rgba(192,193,255,0.08)]">
<div class="flex items-center gap-8">
<span class="text-2xl font-bold tracking-tighter text-indigo-100 font-headline">SENTINEL</span>
<div class="hidden md:flex items-center gap-6 text-slate-400 font-headline tracking-tight">
<a class="text-indigo-200 border-b-2 border-indigo-400 pb-1 hover:text-indigo-100 transition-colors" href="#">Dashboard</a>
<a class="hover:text-indigo-100 transition-colors" href="#">Incidents</a>
<a class="hover:text-indigo-100 transition-colors" href="#">Intelligence</a>
<a class="hover:text-indigo-100 transition-colors" href="#">Automation</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-slate-400 hover:text-indigo-100 transition-colors">notifications</button>
<button class="material-symbols-outlined text-slate-400 hover:text-indigo-100 transition-colors">settings</button>
<div class="h-8 w-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center overflow-hidden">
<img alt="Analyst Profile" class="w-full h-full object-cover" data-alt="Cybersecurity analyst profile avatar with professional tech-oriented appearance in minimalist vector style" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX6XffVqOdL3S4Y3w3jiQY7ixX5x1XBN4C0H1prJzRJ8fz1kWXenyD9vUbVu08bk4twqK0WKgX7tin8MFC1f4z6girwE3YzEKOZaxDJyNo-HD6I_B-u0ROM6KFyrYQswGzDIUR_vMOACPbKwohFQTUQmfhtwdjQtfEvPJQ4E09j1PpWtiw7acUgko3fAGqH3U4siUNN8v6W5vivXTPUyIn8edZCKJVuRScb4mJa_Eu4K7ShB3yUIsn5WNIAbTs0YhrM2cWSVmUn18"/>
</div>
<button class="bg-primary text-on-primary px-4 py-1.5 text-sm font-medium rounded-sm active:scale-95 duration-200">Deploy Patch</button>
</div>
</nav>
<!-- Side Navigation Shell -->
<aside class="h-screen w-64 border-r border-[#464554]/15 bg-[#131b2e] flex flex-col fixed left-0 top-16 bottom-0 hidden lg:flex">
<div class="p-6">
<div class="flex items-center gap-3 mb-8">
<div class="w-10 h-10 bg-surface-container-high rounded flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-weight="fill">radar</span>
</div>
<div>
<h3 class="text-indigo-100 font-bold font-headline leading-tight">Operations</h3>
<p class="font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem] text-slate-500">Level 3 Access</p>
</div>
</div>
<nav class="space-y-1">
<a class="flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-[#222a3d] hover:text-indigo-200 transition-all font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem]" href="#">
<span class="material-symbols-outlined text-lg">radar</span> Threat Hunt
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-indigo-100 bg-[#222a3d] border-r-4 border-indigo-400 transition-all font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem]" href="#">
<span class="material-symbols-outlined text-lg">terminal</span> Log Explorer
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-[#222a3d] hover:text-indigo-200 transition-all font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem]" href="#">
<span class="material-symbols-outlined text-lg">hub</span> Network Map
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-[#222a3d] hover:text-indigo-200 transition-all font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem]" href="#">
<span class="material-symbols-outlined text-lg">inventory_2</span> Asset Inventory
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-[#222a3d] hover:text-indigo-200 transition-all font-['Space_Grotesk'] uppercase tracking-widest text-[0.6875rem]" href="#">
<span class="material-symbols-outlined text-lg">analytics</span> Risk Score
                </a>
</nav>
</div>
<div class="mt-auto p-6 space-y-4">
<button class="w-full bg-surface-container-high border border-outline-variant/20 text-indigo-100 py-2 text-xs font-headline tracking-widest uppercase hover:bg-surface-variant transition-colors">
                New Investigation
            </button>
<div class="pt-4 border-t border-outline-variant/10 space-y-2">
<a class="flex items-center gap-3 text-slate-500 hover:text-indigo-200 text-[0.6875rem] uppercase tracking-widest font-headline" href="#">
<span class="material-symbols-outlined text-lg">potted_plant</span> System Status
                </a>
<a class="flex items-center gap-3 text-slate-500 hover:text-indigo-200 text-[0.6875rem] uppercase tracking-widest font-headline" href="#">
<span class="material-symbols-outlined text-lg">logout</span> Logout
                </a>
</div>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="lg:ml-64 pt-24 px-8 pb-12 min-h-screen">
<!-- Header Section -->
<header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
<div>
<h1 class="text-4xl font-bold font-headline tracking-tighter text-on-surface mb-2">Anomalies Overview</h1>
<p class="text-on-surface-variant max-w-2xl font-light">Real-time heuristic analysis of system behaviors. Displaying detected deviations from baseline operational parameters.</p>
</div>
<div class="flex gap-4">
<div class="bg-surface-container-low px-6 py-4 rounded shadow-lg border-l-2 border-tertiary-container flex items-center gap-4">
<div class="w-3 h-3 rounded-full bg-tertiary-container pulse-ring"></div>
<div>
<div class="text-[0.625rem] font-headline uppercase tracking-[0.2em] text-on-surface-variant">Active Critical</div>
<div class="text-2xl font-mono font-bold text-on-surface">014</div>
</div>
</div>
<div class="bg-surface-container-low px-6 py-4 rounded shadow-lg border-l-2 border-secondary flex items-center gap-4">
<div class="w-3 h-3 rounded-full bg-secondary"></div>
<div>
<div class="text-[0.625rem] font-headline uppercase tracking-[0.2em] text-on-surface-variant">Ongoing Mitigations</div>
<div class="text-2xl font-mono font-bold text-on-surface">082</div>
</div>
</div>
</div>
</header>
<!-- Anomaly Trends Chart Section -->
<section class="mb-8">
<div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 shadow-xl relative overflow-hidden group">
<div class="flex items-center justify-between mb-8">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary">monitoring</span>
<h2 class="text-xl font-headline font-semibold text-indigo-100 uppercase tracking-wider">Anomaly Trends <span class="text-xs font-normal text-slate-500 ml-2">(Last 24 Hours)</span></h2>
</div>
<div class="flex items-center gap-2">
<div class="px-3 py-1 bg-surface-container-lowest rounded text-[0.6875rem] font-headline text-slate-400 border border-outline-variant/10">1H INTERVAL</div>
<button class="material-symbols-outlined text-slate-500 hover:text-indigo-100">more_vert</button>
</div>
</div>
<!-- Abstract Chart Visualization -->
<div class="h-64 w-full relative">
<div class="absolute inset-0 flex items-end justify-between px-2">
<!-- Simulated Chart Bars/Area -->
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[30%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[45%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[25%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[60%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[80%] rounded-t-sm relative">
<div class="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#c0c1ff]"></div>
</div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[40%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[55%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[95%] rounded-t-sm relative">
<div class="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-tertiary-container shadow-[0_0_10px_#ff516a]"></div>
</div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[70%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[50%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[35%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[40%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[65%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[85%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[75%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[45%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[30%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[55%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[60%] rounded-t-sm"></div>
<div class="w-[4%] bg-gradient-to-t from-primary/10 to-primary/40 h-[90%] rounded-t-sm relative">
<div class="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#c0c1ff]"></div>
</div>
</div>
<!-- Horizontal Grid Lines -->
<div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
<div class="border-t border-outline-variant w-full"></div>
<div class="border-t border-outline-variant w-full"></div>
<div class="border-t border-outline-variant w-full"></div>
<div class="border-t border-outline-variant w-full"></div>
</div>
</div>
<div class="flex justify-between mt-4 px-2 font-mono text-[0.625rem] text-slate-500">
<span>00:00</span>
<span>04:00</span>
<span>08:00</span>
<span>12:00</span>
<span>16:00</span>
<span>20:00</span>
<span>23:59</span>
</div>
</div>
</section>
<!-- Recent Anomalies Table Section -->
<section class="grid grid-cols-1 xl:grid-cols-4 gap-8">
<div class="xl:col-span-3">
<div class="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden shadow-2xl">
<div class="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10">
<h2 class="text-lg font-headline font-semibold text-indigo-100 uppercase tracking-widest">Recent Anomalies</h2>
<div class="flex items-center gap-4">
<div class="relative group">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
<input class="bg-surface-container-lowest border-none border-b border-outline-variant/30 focus:ring-0 focus:border-primary text-[0.6875rem] font-mono pl-9 py-1.5 w-48 text-indigo-100 placeholder:text-slate-600 transition-all" placeholder="FILTER TARGET..." type="text"/>
</div>
<button class="material-symbols-outlined text-slate-500 hover:text-indigo-100 transition-colors">filter_list</button>
</div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-lowest/50 text-slate-500 font-headline uppercase tracking-widest text-[0.625rem]">
<th class="px-6 py-4 font-semibold">Timestamp</th>
<th class="px-6 py-4 font-semibold">Anomaly Type</th>
<th class="px-6 py-4 font-semibold">Severity</th>
<th class="px-6 py-4 font-semibold">Target User</th>
<th class="px-6 py-4 font-semibold">Status</th>
<th class="px-6 py-4 font-semibold">Action</th>
</tr>
</thead>
<tbody class="text-[0.8125rem] font-body">
<tr class="border-b border-outline-variant/5 hover:bg-surface-container-high/40 transition-colors">
<td class="px-6 py-4 font-mono text-on-surface-variant">2023-10-24 14:22:01</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-tertiary-container shadow-[0_0_8px_#ff516a]"></span>
<span class="text-indigo-100 font-medium">Geo-Jump Detected</span>
</div>
</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 text-[0.6875rem] font-headline font-bold rounded-sm uppercase tracking-tighter">Critical</span>
</td>
<td class="px-6 py-4 font-mono text-indigo-300">j.anderson_sys</td>
<td class="px-6 py-4">
<span class="flex items-center gap-2 text-on-surface-variant italic">
<span class="material-symbols-outlined text-sm text-secondary">pending</span> Investigating
                                        </span>
</td>
<td class="px-6 py-4">
<button class="text-primary hover:text-indigo-200 transition-colors font-mono text-[0.6875rem] uppercase underline underline-offset-4 decoration-primary/30">Review</button>
</td>
</tr>
<tr class="border-b border-outline-variant/5 hover:bg-surface-container-high/40 transition-colors">
<td class="px-6 py-4 font-mono text-on-surface-variant">2023-10-24 14:18:45</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#c0c1ff]"></span>
<span class="text-indigo-100 font-medium">Brute Force Attempt</span>
</div>
</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-primary/10 text-primary border border-primary/30 text-[0.6875rem] font-headline font-bold rounded-sm uppercase tracking-tighter">High</span>
</td>
<td class="px-6 py-4 font-mono text-indigo-300">root_srv_prod_04</td>
<td class="px-6 py-4">
<span class="flex items-center gap-2 text-on-surface-variant italic">
<span class="material-symbols-outlined text-sm text-on-surface-variant/40">circle</span> New
                                        </span>
</td>
<td class="px-6 py-4">
<button class="text-primary hover:text-indigo-200 transition-colors font-mono text-[0.6875rem] uppercase underline underline-offset-4 decoration-primary/30">Review</button>
</td>
</tr>
<tr class="border-b border-outline-variant/5 hover:bg-surface-container-high/40 transition-colors">
<td class="px-6 py-4 font-mono text-on-surface-variant">2023-10-24 13:55:12</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#00a2e6]"></span>
<span class="text-indigo-100 font-medium">Excessive API Calls</span>
</div>
</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/30 text-[0.6875rem] font-headline font-bold rounded-sm uppercase tracking-tighter">Medium</span>
</td>
<td class="px-6 py-4 font-mono text-indigo-300">ext_gateway_99</td>
<td class="px-6 py-4">
<span class="flex items-center gap-2 text-emerald-500 italic">
<span class="material-symbols-outlined text-sm">check_circle</span> Mitigated
                                        </span>
</td>
<td class="px-6 py-4">
<button class="text-primary hover:text-indigo-200 transition-colors font-mono text-[0.6875rem] uppercase underline underline-offset-4 decoration-primary/30">Review</button>
</td>
</tr>
<tr class="border-b border-outline-variant/5 hover:bg-surface-container-high/40 transition-colors">
<td class="px-6 py-4 font-mono text-on-surface-variant">2023-10-24 13:42:30</td>
<td class="px-6 py-4">
<div class="flex items-center gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-tertiary-container shadow-[0_0_8px_#ff516a]"></span>
<span class="text-indigo-100 font-medium">Memory Overflow (Sig)</span>
</div>
</td>
<td class="px-6 py-4">
<span class="px-2 py-0.5 bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 text-[0.6875rem] font-headline font-bold rounded-sm uppercase tracking-tighter">Critical</span>
</td>
<td class="px-6 py-4 font-mono text-indigo-300">db_main_repl</td>
<td class="px-6 py-4">
<span class="flex items-center gap-2 text-on-surface-variant italic">
<span class="material-symbols-outlined text-sm text-secondary">pending</span> Investigating
                                        </span>
</td>
<td class="px-6 py-4">
<button class="text-primary hover:text-indigo-200 transition-colors font-mono text-[0.6875rem] uppercase underline underline-offset-4 decoration-primary/30">Review</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<!-- Side Intelligence Panel -->
<div class="space-y-6">
<div class="bg-surface-container-low rounded-xl border border-outline-variant/10 p-5 shadow-xl">
<h3 class="text-xs font-headline font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Origin Heatmap</h3>
<div class="h-40 w-full rounded bg-surface-container-lowest border border-outline-variant/10 overflow-hidden relative">
<img alt="Global cyber attack heatmap showing glowing clusters of activity in major metropolitan areas" class="w-full h-full object-cover opacity-40 mix-blend-luminosity" data-location="world" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3aO3frx-EF5Fj8ftSi-Mft5KX32uxt6YcC9U8S0juZkUwLilFUejTWzgfe1pCBJsMQacMnTvwvQ9kH0OkvqjonCnwCjN77WODDYaU9NB4S7rXbuRlzl-733F3Lpg6Z7TR2QoP7hGhWO56KyRKrUPxQ5Yf-07nxxlMPnwENK5ZEVZgz1CkRwO774oEKJelLo-Onte8jcC5UxHds9t7SB51W9vwfW7U9Sp1S8xSeMDnSUlObmfYsxtYj0yJ6s3HqPEvXQQjN_mjHFU"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
<!-- Glowing Pips -->
<div class="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-tertiary-container pulse-ring"></div>
<div class="absolute bottom-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-primary"></div>
<div class="absolute top-2/3 left-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
</div>
</div>
<div class="bg-surface-container-low rounded-xl border border-outline-variant/10 p-5 shadow-xl">
<h3 class="text-xs font-headline font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Tactical Intelligence</h3>
<div class="space-y-4">
<div class="p-3 bg-surface-container-lowest border-l-2 border-primary rounded-r">
<p class="text-[0.6875rem] font-headline uppercase text-primary mb-1">Alert Alpha-9</p>
<p class="text-xs text-on-surface-variant leading-relaxed">Cluster of failed SSH handshakes from subnet 192.168.1.0/24. Source IP blacklisted.</p>
</div>
<div class="p-3 bg-surface-container-lowest border-l-2 border-secondary rounded-r">
<p class="text-[0.6875rem] font-headline uppercase text-secondary mb-1">System Advisory</p>
<p class="text-xs text-on-surface-variant leading-relaxed">Baseline drifting 14% on Database Main. Re-calculating normal operational parameters.</p>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Contextual FAB (Hidden on transactional detail pages, shown here) -->
<div class="fixed bottom-8 right-8">
<button class="h-14 w-14 rounded-full bg-primary text-on-primary shadow-[0_0_20px_rgba(192,193,255,0.4)] flex items-center justify-center active:scale-90 transition-transform">
<span class="material-symbols-outlined text-3xl">add</span>
</button>
</div>
</body></html>

<!-- Anomalies Overview -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Mitigation Strategies | Obsidian Sentinel</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "outline": "#908fa0",
                        "on-background": "#dae2fd",
                        "on-tertiary-fixed": "#40000d",
                        "on-primary": "#1000a9",
                        "secondary-fixed-dim": "#89ceff",
                        "surface-container-highest": "#2d3449",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "tertiary-container": "#ff516a",
                        "surface-container": "#171f33",
                        "error": "#ffb4ab",
                        "on-secondary-container": "#00344e",
                        "surface-bright": "#31394d",
                        "primary-fixed-dim": "#c0c1ff",
                        "on-primary-container": "#0d0096",
                        "surface-tint": "#c0c1ff",
                        "on-tertiary-container": "#5b0017",
                        "on-secondary": "#00344d",
                        "on-secondary-fixed-variant": "#004c6e",
                        "on-primary-fixed": "#07006c",
                        "surface-container-low": "#131b2e",
                        "on-surface-variant": "#c7c4d7",
                        "on-secondary-fixed": "#001e2f",
                        "surface-dim": "#0b1326",
                        "on-surface": "#dae2fd",
                        "surface-container-high": "#222a3d",
                        "secondary-fixed": "#c9e6ff",
                        "primary-container": "#8083ff",
                        "on-tertiary-fixed-variant": "#92002a",
                        "primary": "#c0c1ff",
                        "inverse-surface": "#dae2fd",
                        "inverse-primary": "#494bd6",
                        "on-tertiary": "#67001b",
                        "inverse-on-surface": "#283044",
                        "on-error": "#690005",
                        "error-container": "#93000a",
                        "tertiary-fixed-dim": "#ffb2b7",
                        "surface-variant": "#2d3449",
                        "tertiary": "#ffb2b7",
                        "primary-fixed": "#e1e0ff",
                        "secondary-container": "#00a2e6",
                        "secondary": "#89ceff",
                        "outline-variant": "#464554",
                        "tertiary-fixed": "#ffdadb",
                        "on-error-container": "#ffdad6",
                        "surface-container-lowest": "#060e20",
                        "surface": "#0b1326",
                        "background": "#0b1326"
                    },
                    fontFamily: {
                        "headline": ["Space Grotesk"],
                        "body": ["Inter"],
                        "label": ["Inter"],
                        "mono": ["JetBrains Mono"]
                    },
                    borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
                },
            },
        }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; }
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
        .font-jetbrains-mono { font-family: 'JetBrains Mono', monospace; }
        .glass-panel { backdrop-filter: blur(12px); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d3449; border-radius: 2px; }
    </style>
</head>
<body class="bg-surface text-on-surface overflow-hidden">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-slate-900/60 backdrop-blur-md flex justify-between items-center px-6 h-16 w-full shadow-none border-b border-outline-variant/10">
<div class="flex items-center gap-4">
<span class="text-xl font-bold tracking-tighter text-indigo-400 uppercase font-space-grotesk">Obsidian Sentinel</span>
<div class="h-4 w-[1px] bg-outline-variant/30 hidden md:block"></div>
<span class="font-space-grotesk text-sm tracking-tight text-slate-400 hidden md:block uppercase">Mitigation Command</span>
</div>
<div class="flex items-center gap-6">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer" data-icon="notifications">notifications</span>
<span class="material-symbols-outlined text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer" data-icon="terminal">terminal</span>
<span class="material-symbols-outlined text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer" data-icon="settings">settings</span>
</div>
<div class="h-8 w-8 rounded-sm overflow-hidden border border-outline-variant/20">
<img alt="Analyst Profile" class="w-full h-full object-cover" data-alt="close-up portrait of a professional male cyber security analyst with focused expression and subtle blue tech lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCohucieDGIjdgjTv8P_TyRG1Jfbg2n_I5SH4hyxMFLEaQbtaQolDSwp6InJMFn08XS45MiauRS1tx1OGCJ9hl_yJ2rWbsE-i_AHlAq_y5g9uffDN9uKHNAbx5cR4EhsVfLV3rbpzS8wUpwX26V92xmmiApruAmyVx5MsiQ-LqZ1aUi_l58xXe_6ovx1WlSkM3L4ZKLvrcc4Q-7BRF-l0uIgZaTEhW7mtKKJFDA04Who18oxxnt27toICKZ9McvXU9mrOe5HRtHN_Y"/>
</div>
</div>
</header>
<!-- SideNavBar -->
<aside class="fixed left-0 top-0 h-full w-64 z-40 bg-slate-950 flex flex-col pt-20 pb-6 border-r border-outline-variant/5">
<div class="px-6 mb-8">
<div class="flex items-center gap-3 mb-2">
<div class="w-8 h-8 bg-indigo-500/20 flex items-center justify-center rounded">
<span class="material-symbols-outlined text-indigo-400 text-lg" data-icon="shield">shield</span>
</div>
<div>
<h2 class="text-indigo-400 font-black font-space-grotesk text-sm tracking-tight">Obsidian Sentinel</h2>
<p class="font-space-grotesk text-[10px] uppercase tracking-widest text-slate-500">Command Center</p>
</div>
</div>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center px-6 py-3 text-slate-500 font-space-grotesk text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-slate-200 transition-all active:scale-95 duration-150 group" href="#">
<span class="material-symbols-outlined mr-4 group-hover:text-indigo-400" data-icon="shield">shield</span>
                Threat Engine
            </a>
<a class="flex items-center px-6 py-3 text-indigo-400 border-r-2 border-indigo-500 bg-indigo-500/5 font-space-grotesk text-xs uppercase tracking-widest transition-all active:scale-95 duration-150" href="#">
<span class="material-symbols-outlined mr-4" data-icon="security_update_good">security_update_good</span>
                Mitigation
            </a>
<a class="flex items-center px-6 py-3 text-slate-500 font-space-grotesk text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-slate-200 transition-all active:scale-95 duration-150 group" href="#">
<span class="material-symbols-outlined mr-4 group-hover:text-indigo-400" data-icon="hub">hub</span>
                Network Maps
            </a>
<a class="flex items-center px-6 py-3 text-slate-500 font-space-grotesk text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-slate-200 transition-all active:scale-95 duration-150 group" href="#">
<span class="material-symbols-outlined mr-4 group-hover:text-indigo-400" data-icon="terminal">terminal</span>
                Log Streams
            </a>
<a class="flex items-center px-6 py-3 text-slate-500 font-space-grotesk text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-slate-200 transition-all active:scale-95 duration-150 group" href="#">
<span class="material-symbols-outlined mr-4 group-hover:text-indigo-400" data-icon="inventory_2">inventory_2</span>
                Archives
            </a>
</nav>
<div class="px-6 mt-auto space-y-4">
<button class="w-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 py-2 font-space-grotesk text-[10px] uppercase tracking-tighter hover:bg-indigo-500/20 transition-all">
                New Strategy
            </button>
<div class="pt-4 border-t border-outline-variant/10">
<a class="flex items-center py-2 text-slate-500 font-space-grotesk text-[10px] uppercase tracking-widest hover:text-slate-200" href="#">
<span class="material-symbols-outlined mr-3 text-sm" data-icon="analytics">analytics</span>
                    System Health
                </a>
<a class="flex items-center py-2 text-slate-500 font-space-grotesk text-[10px] uppercase tracking-widest hover:text-slate-200" href="#">
<span class="material-symbols-outlined mr-3 text-sm" data-icon="help_outline">help_outline</span>
                    Support
                </a>
</div>
</div>
</aside>
<!-- Main Content -->
<main class="ml-64 pt-20 p-8 h-screen overflow-y-auto custom-scrollbar bg-surface-dim">
<header class="mb-10 flex justify-between items-end">
<div class="max-w-2xl">
<h1 class="text-3xl font-bold font-space-grotesk tracking-tighter text-on-surface mb-2">Mitigation Strategies</h1>
<p class="text-on-surface-variant text-sm leading-relaxed">Active countermeasure protocols across regional nodes. Deploy autonomous defensive patterns to neutralize detected behavioral anomalies in real-time.</p>
</div>
<div class="flex gap-4">
<div class="bg-surface-container-low px-4 py-2 border border-outline-variant/10 rounded-sm">
<p class="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Active Protocols</p>
<p class="font-jetbrains-mono text-indigo-400 font-bold">14 / 20</p>
</div>
<div class="bg-surface-container-low px-4 py-2 border border-outline-variant/10 rounded-sm">
<p class="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Global Health</p>
<p class="font-jetbrains-mono text-emerald-400 font-bold">99.98%</p>
</div>
</div>
</header>
<!-- Mitigation Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<!-- Card 1: IP-Based Blocking -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="block">block</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-jetbrains-mono border border-emerald-500/20">ACTIVE</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">IP-Based Blocking</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Automatically blacklists high-risk IPs based on real-time behavioral analysis and velocity thresholds.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">98.4%</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">1.2k</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-error-container/20 text-error text-[10px] uppercase tracking-widest hover:bg-error-container/30 transition-colors">Disable</button>
</div>
</div>
<!-- Card 2: MFA Reset Protocol -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="vpn_key">vpn_key</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-jetbrains-mono border border-emerald-500/20">ACTIVE</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">MFA Reset Protocol</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Enforces immediate step-up authentication when login patterns deviate from established user baselines.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">99.1%</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">452</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-error-container/20 text-error text-[10px] uppercase tracking-widest hover:bg-error-container/30 transition-colors">Disable</button>
</div>
</div>
<!-- Card 3: Session Invalidation -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="logout">logout</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-slate-500/10 text-slate-500 text-[10px] font-bold font-jetbrains-mono border border-slate-500/20">INACTIVE</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">Session Invalidation</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Forcefully terminates all active JWTs for targeted accounts identified in credential spill databases.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">87.2%</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">0</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-colors">Enable</button>
</div>
</div>
<!-- Card 4: Credential Isolation -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="lock_reset">lock_reset</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-jetbrains-mono border border-emerald-500/20">ACTIVE</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">Credential Isolation</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Moves suspected accounts to a restricted vault environment with limited API read access.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">94.8%</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">842</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-error-container/20 text-error text-[10px] uppercase tracking-widest hover:bg-error-container/30 transition-colors">Disable</button>
</div>
</div>
<!-- Card 5: Geolocation Fencing -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="public">public</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-500 text-[10px] font-bold font-jetbrains-mono border border-amber-500/20">PENDING</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">Geolocation Fencing</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Dynamic blocking of authentication requests originating from non-authorized jurisdictional boundaries.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">N/A</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">14</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-colors">Deploy</button>
</div>
</div>
<!-- Card 6: Credential Stuffing Filter -->
<div class="bg-surface-container-low border border-outline-variant/10 p-5 group hover:border-indigo-500/30 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-indigo-500/10 rounded-sm">
<span class="material-symbols-outlined text-indigo-400 text-xl" data-icon="filter_alt">filter_alt</span>
</div>
<span class="px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-jetbrains-mono border border-emerald-500/20">ACTIVE</span>
</div>
<h3 class="font-space-grotesk font-bold text-lg mb-2 text-on-surface">Credential Stuffing Filter</h3>
<p class="text-on-surface-variant text-xs mb-6 h-8 overflow-hidden line-clamp-2">Identifies and neutralizes brute-force automation attempts using pattern-matching on HTTP headers.</p>
<div class="flex items-center gap-6 mb-6">
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Success Rate</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">99.9%</p>
</div>
<div>
<p class="text-[9px] uppercase tracking-tighter text-slate-500 mb-1">Deploy Count</p>
<p class="font-jetbrains-mono text-sm text-indigo-300">5.8k</p>
</div>
</div>
<div class="flex gap-3 pt-4 border-t border-outline-variant/5">
<button class="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface text-[10px] uppercase tracking-widest py-2 px-3 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-xs" data-icon="tune">tune</span> Configure
                    </button>
<button class="px-3 bg-error-container/20 text-error text-[10px] uppercase tracking-widest hover:bg-error-container/30 transition-colors">Disable</button>
</div>
</div>
</div>
<!-- System Logs / Intelligence Footer (Density focus) -->
<section class="mt-12">
<h4 class="font-space-grotesk text-xs uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Real-Time Mitigation Log
            </h4>
<div class="bg-surface-container-lowest border border-outline-variant/5 overflow-hidden">
<table class="w-full text-left font-jetbrains-mono text-[10px]">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant/10 text-slate-500 uppercase tracking-tighter">
<th class="py-2 px-4">Timestamp</th>
<th class="py-2 px-4">Strategy</th>
<th class="py-2 px-4">Target Node</th>
<th class="py-2 px-4">Action Taken</th>
<th class="py-2 px-4 text-right">Confidence</th>
</tr>
</thead>
<tbody class="text-on-surface-variant">
<tr class="hover:bg-indigo-500/5 border-b border-outline-variant/5">
<td class="py-2 px-4 text-slate-500">2023-11-24 14:02:11.433</td>
<td class="py-2 px-4 text-indigo-400">IP-Based Blocking</td>
<td class="py-2 px-4">US-EAST-01</td>
<td class="py-2 px-4 text-emerald-400">DENY_ALL 192.168.1.104</td>
<td class="py-2 px-4 text-right">0.9994</td>
</tr>
<tr class="hover:bg-indigo-500/5 border-b border-outline-variant/5 bg-slate-900/20">
<td class="py-2 px-4 text-slate-500">2023-11-24 14:01:58.211</td>
<td class="py-2 px-4 text-indigo-400">MFA Reset</td>
<td class="py-2 px-4">EU-WEST-02</td>
<td class="py-2 px-4 text-emerald-400">FORCE_CHALLENGE account_id_99</td>
<td class="py-2 px-4 text-right">0.9812</td>
</tr>
<tr class="hover:bg-indigo-500/5">
<td class="py-2 px-4 text-slate-500">2023-11-24 13:59:44.091</td>
<td class="py-2 px-4 text-indigo-400">Credential Stuffing</td>
<td class="py-2 px-4">ASIA-NE-01</td>
<td class="py-2 px-4 text-emerald-400">THROTTLE_HEADERS_MATCH</td>
<td class="py-2 px-4 text-right">1.0000</td>
</tr>
</tbody>
</table>
</div>
</section>
</main>
</body></html>

<!-- Mitigation Strategies Overview -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SENTINEL_OS | CRITICAL_ERROR</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pulse-ring {
            box-shadow: 0 0 0 0 rgba(255, 81, 106, 0.7);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 81, 106, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(255, 81, 106, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 81, 106, 0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0b1326; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #464554; border-radius: 2px; }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "surface-container-lowest": "#060e20",
                "on-secondary-fixed": "#001e2f",
                "error-container": "#93000a",
                "primary-fixed": "#e1e0ff",
                "on-tertiary": "#67001b",
                "on-surface-variant": "#c7c4d7",
                "on-primary-fixed": "#07006c",
                "on-primary-container": "#0d0096",
                "surface-dim": "#0b1326",
                "on-tertiary-container": "#5b0017",
                "on-primary-fixed-variant": "#2f2ebe",
                "on-error-container": "#ffdad6",
                "surface": "#0b1326",
                "surface-container-highest": "#2d3449",
                "primary": "#c0c1ff",
                "secondary-fixed-dim": "#89ceff",
                "on-tertiary-fixed": "#40000d",
                "on-secondary-container": "#00344e",
                "secondary-container": "#00a2e6",
                "surface-container-high": "#222a3d",
                "surface-variant": "#2d3449",
                "on-surface": "#dae2fd",
                "on-secondary-fixed-variant": "#004c6e",
                "secondary-fixed": "#c9e6ff",
                "surface-tint": "#c0c1ff",
                "surface-container": "#171f33",
                "secondary": "#89ceff",
                "primary-container": "#8083ff",
                "error": "#ffb4ab",
                "on-tertiary-fixed-variant": "#92002a",
                "on-primary": "#1000a9",
                "background": "#0b1326",
                "outline-variant": "#464554",
                "primary-fixed-dim": "#c0c1ff",
                "surface-bright": "#31394d",
                "surface-container-low": "#131b2e",
                "outline": "#908fa0",
                "inverse-on-surface": "#283044",
                "on-background": "#dae2fd",
                "tertiary-container": "#ff516a",
                "tertiary": "#ffb2b7",
                "on-secondary": "#00344d",
                "inverse-primary": "#494bd6",
                "tertiary-fixed-dim": "#ffb2b7",
                "tertiary-fixed": "#ffdadb",
                "on-error": "#690005",
                "inverse-surface": "#dae2fd"
              },
              fontFamily: {
                "headline": ["Space Grotesk"],
                "body": ["Inter"],
                "label": ["Inter"],
                "mono": ["JetBrains Mono"]
              },
              borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
            },
          },
        }
    </script>
</head>
<body class="bg-surface text-on-surface font-body selection:bg-primary/30 antialiased overflow-hidden">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-md flex justify-between items-center px-6 h-16 border-b border-[#464554]/15 shadow-[0_8px_32px_rgba(192,193,255,0.08)]">
<div class="flex items-center gap-8">
<span class="font-black tracking-widest text-[#c0c1ff] font-headline text-xl">SENTINEL_OS</span>
<nav class="hidden md:flex gap-6 font-['Space_Grotesk'] tracking-tight text-sm uppercase">
<a class="text-[#c7c4d7] hover:text-[#dae2fd] transition-all duration-200" href="#">DASHBOARD</a>
<a class="text-[#c7c4d7] hover:text-[#dae2fd] transition-all duration-200" href="#">INCIDENTS</a>
<a class="text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-1" href="#">SYSTEM</a>
<a class="text-[#c7c4d7] hover:text-[#dae2fd] transition-all duration-200" href="#">LOGS</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative group">
<button class="p-2 hover:bg-[#2d3449]/50 transition-all duration-200 active:scale-95 text-[#c0c1ff]">
<span class="material-symbols-outlined">notifications</span>
</button>
</div>
<button class="p-2 hover:bg-[#2d3449]/50 transition-all duration-200 active:scale-95 text-[#c0c1ff]">
<span class="material-symbols-outlined">settings</span>
</button>
<div class="h-8 w-8 rounded-sm bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/30">
<img alt="Analyst Profile" class="h-full w-full object-cover" data-alt="Cybersecurity analyst profile avatar, close-up with neon blue highlights, cinematic lighting, high-tech tactical gear aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-AvleLW4n_qoGSQAySXC4KAgUpFo6TWUO9N3qJ0yPsHh_AthsoKDm-cl17Q39C93q03ruT0gaPwIzb-5K2IWr-auDHAtOzm1L3plHNCRS3ma3lrc33wrSmRiI9Qe28eoWgg1lFi2akZSvu4Z5ZnR1JpAw6PJkTGQZUCVU4Y2YgZg3d28MIP5osrsYQ1h7_UNJbi4H90TU7ewGTbtncj7OPnow9sYardIg5k2iwADMHMh_ZqeRam1sKUPPCZOZ4ByuxGTLzDUQSnI"/>
</div>
</div>
</header>
<!-- SideNavBar -->
<aside class="fixed left-0 top-0 h-full w-20 hover:w-64 transition-all duration-300 z-40 bg-[#131b2e] border-r border-[#464554]/15 flex flex-col py-20 font-['JetBrains_Mono'] text-xs group">
<div class="px-4 mb-8 flex items-center gap-4">
<div class="h-10 w-10 flex-shrink-0 bg-tertiary-container/20 rounded-sm flex items-center justify-center pulse-ring">
<span class="material-symbols-outlined text-tertiary-container" style="font-variation-settings: 'FILL' 1;">warning</span>
</div>
<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
<p class="text-[#c0c1ff] font-bold">NODE_01</p>
<p class="text-tertiary-container text-[10px] animate-pulse">CRITICAL_STATE</p>
</div>
</div>
<nav class="flex-grow space-y-2">
<a class="flex items-center h-12 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] hover:bg-[#222a3d] transition-all duration-300" href="#">
<span class="material-symbols-outlined">grid_view</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Overview</span>
</a>
<a class="flex items-center h-12 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] hover:bg-[#222a3d] transition-all duration-300" href="#">
<span class="material-symbols-outlined">lan</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Network</span>
</a>
<a class="flex items-center h-12 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] hover:bg-[#222a3d] transition-all duration-300" href="#">
<span class="material-symbols-outlined">emergency_home</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Threats</span>
</a>
<a class="flex items-center h-12 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] hover:bg-[#222a3d] transition-all duration-300" href="#">
<span class="material-symbols-outlined">psychology</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Intelligence</span>
</a>
<a class="flex items-center h-12 px-6 gap-4 bg-[#c0c1ff]/10 text-[#c0c1ff] border-r-4 border-[#c0c1ff] transition-all duration-300" href="#">
<span class="material-symbols-outlined">terminal</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">System</span>
</a>
</nav>
<div class="px-4 py-6 border-t border-[#464554]/10">
<button class="w-full h-10 bg-tertiary-container text-on-tertiary font-bold text-[10px] rounded-sm flex items-center justify-center gap-2 overflow-hidden">
<span class="material-symbols-outlined text-sm">bolt</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">RECOVERY_MODE</span>
</button>
</div>
<div class="space-y-2 mb-4">
<a class="flex items-center h-10 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] transition-all duration-300" href="#">
<span class="material-symbols-outlined text-sm">help</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Support</span>
</a>
<a class="flex items-center h-10 px-6 gap-4 text-[#464554] hover:text-[#c7c4d7] transition-all duration-300" href="#">
<span class="material-symbols-outlined text-sm">description</span>
<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Documentation</span>
</a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="pl-20 pt-16 h-screen w-full flex flex-col overflow-hidden bg-surface">
<div class="flex-grow p-8 flex flex-col max-w-7xl mx-auto w-full gap-8">
<!-- Header Section -->
<div class="space-y-1">
<h1 class="font-headline font-bold text-4xl text-tertiary-container tracking-tighter">
                    CRITICAL: CONNECTION_REFUSED
                </h1>
<p class="font-mono text-on-surface-variant text-sm tracking-tight opacity-80">
                    API Endpoint Unreachable at <span class="text-secondary">http://localhost:8000</span>
</p>
</div>
<!-- Bento Layout Content -->
<div class="grid grid-cols-12 gap-6 flex-grow overflow-hidden">
<!-- Alert & Actions Column -->
<div class="col-span-12 lg:col-span-7 flex flex-col gap-6">
<!-- Main Alert Card -->
<section class="bg-surface-container-low p-8 relative overflow-hidden group border-l-4 border-tertiary-container h-full">
<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
<span class="material-symbols-outlined text-[120px]">report_problem</span>
</div>
<div class="flex items-start gap-6 relative z-10">
<div class="flex-shrink-0 mt-2">
<div class="h-16 w-16 bg-tertiary-container/10 flex items-center justify-center pulse-ring">
<span class="material-symbols-outlined text-tertiary-container text-4xl" style="font-variation-settings: 'FILL' 1;">error</span>
</div>
</div>
<div class="space-y-4">
<div class="space-y-2">
<h2 class="text-2xl font-headline font-semibold text-on-surface">System Handshake Failure</h2>
<p class="text-on-surface-variant leading-relaxed max-w-lg">
                                        The sentinel core node was unable to establish a secure TCP handshake with the backend processing cluster. Authentication packets were dropped before resolution.
                                    </p>
</div>
<div class="flex items-center gap-6 pt-4">
<div class="space-y-1">
<p class="text-[10px] text-outline font-bold tracking-widest uppercase">Last Success</p>
<p class="font-mono text-secondary-fixed-dim">2026-05-14 14:15:22</p>
</div>
<div class="space-y-1 border-l border-outline-variant/30 pl-6">
<p class="text-[10px] text-outline font-bold tracking-widest uppercase">Node ID</p>
<p class="font-mono text-secondary-fixed-dim">US-WEST-SENT-01</p>
</div>
</div>
</div>
</div>
<!-- Action Buttons -->
<div class="mt-auto pt-10 flex gap-4">
<button class="px-8 py-3 bg-transparent border-2 border-primary text-primary font-bold tracking-wide hover:bg-primary/10 transition-all duration-200 active:scale-95 flex items-center gap-2">
<span class="material-symbols-outlined text-sm">refresh</span>
                                ATTEMPT RECONNECTION
                            </button>
<button class="px-8 py-3 bg-surface-container-highest text-on-surface-variant font-bold tracking-wide hover:text-on-surface transition-all duration-200 active:scale-95 flex items-center gap-2 border border-outline-variant/20">
<span class="material-symbols-outlined text-sm">support_agent</span>
                                REPORT ISSUE
                            </button>
</div>
</section>
<!-- Technical Logs -->
<section class="bg-surface-container-low flex flex-col overflow-hidden h-full max-h-[300px]">
<div class="px-6 py-4 bg-surface-container-high border-b border-outline-variant/10 flex justify-between items-center">
<h3 class="font-mono text-[10px] font-bold text-outline tracking-widest uppercase">RAW_STACK_TRACE_OUTPUT</h3>
<span class="px-2 py-0.5 bg-tertiary-container/10 text-tertiary-container text-[10px] font-mono">DEBUG_LEVEL: HIGH</span>
</div>
<div class="p-6 font-mono text-xs text-on-surface-variant/80 overflow-y-auto custom-scrollbar leading-5 space-y-1">
<p><span class="text-outline">[14:15:42]</span> <span class="text-tertiary-container">ERR:</span> syscall.connect(addr=127.0.0.1:8000) failed: Connection refused</p>
<p><span class="text-outline">[14:15:42]</span> <span class="text-on-surface-variant">INFO:</span> Retrying in 2000ms...</p>
<p><span class="text-outline">[14:15:44]</span> <span class="text-tertiary-container">ERR:</span> syscall.connect(addr=127.0.0.1:8000) failed: Connection refused</p>
<p><span class="text-outline">[14:15:44]</span> <span class="text-on-surface-variant">WARN:</span> Node heartbeat missing for 4000ms</p>
<p><span class="text-outline">[14:15:46]</span> <span class="text-tertiary-container">CRIT:</span> MAX_RETRIES_EXCEEDED (3/3)</p>
<p><span class="text-outline">[14:15:46]</span> <span class="text-on-surface-variant">INFO:</span> Entering fallback: LOCAL_DIAGNOSTIC_MODE</p>
<p><span class="text-outline">[14:15:46]</span> <span class="text-outline">--- Trace End ---</span></p>
</div>
</section>
</div>
<!-- Troubleshooting Column -->
<div class="col-span-12 lg:col-span-5 flex flex-col gap-6">
<!-- Troubleshooting Panel -->
<section class="bg-surface-container-low p-8 flex flex-col h-full">
<div class="flex items-center gap-3 mb-8">
<span class="material-symbols-outlined text-secondary">inventory_2</span>
<h3 class="font-headline font-bold text-lg text-on-surface tracking-tight">RECOMMENDED_ACTIONS</h3>
</div>
<div class="space-y-4">
<!-- Step 1 -->
<div class="group flex items-start gap-4 p-4 bg-surface-container-high/40 border border-outline-variant/5 hover:border-secondary/30 transition-all cursor-default">
<span class="flex-shrink-0 font-mono text-secondary text-sm font-bold">01</span>
<div class="space-y-1">
<p class="text-sm font-bold text-on-surface">Check local server status</p>
<p class="text-xs text-on-surface-variant">Verify the Docker container or local service process is active.</p>
</div>
</div>
<!-- Step 2 -->
<div class="group flex items-start gap-4 p-4 bg-surface-container-high/40 border border-outline-variant/5 hover:border-secondary/30 transition-all cursor-default">
<span class="flex-shrink-0 font-mono text-secondary text-sm font-bold">02</span>
<div class="space-y-1">
<p class="text-sm font-bold text-on-surface">Verify network connectivity</p>
<p class="text-xs text-on-surface-variant">Ensure no firewall or VPN is intercepting port 8000 traffic.</p>
</div>
</div>
<!-- Step 3 -->
<div class="group flex items-start gap-4 p-4 bg-surface-container-high/40 border border-outline-variant/5 hover:border-secondary/30 transition-all cursor-default">
<span class="flex-shrink-0 font-mono text-secondary text-sm font-bold">03</span>
<div class="space-y-1">
<p class="text-sm font-bold text-on-surface">Review backend logs</p>
<p class="text-xs text-on-surface-variant">Check 'logs/api_main.log' for unhandled exceptions.</p>
</div>
</div>
<!-- Step 4 -->
<div class="group flex items-start gap-4 p-4 bg-surface-container-high/40 border border-outline-variant/5 hover:border-secondary/30 transition-all cursor-default">
<span class="flex-shrink-0 font-mono text-secondary text-sm font-bold">04</span>
<div class="space-y-1">
<p class="text-sm font-bold text-on-surface">Check port configuration</p>
<p class="text-xs text-on-surface-variant">Confirm environmental variables match host settings.</p>
</div>
</div>
</div>
<!-- System Visual Context -->
<div class="mt-8 relative h-full min-h-[160px] bg-surface-container-lowest/50 border border-outline-variant/10 overflow-hidden">
<img alt="Technical system blueprint" class="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-50" data-alt="Technical blueprint of a server cluster with glowing red data lines and digital circuitry patterns, dark obsidian aesthetic, isometric view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgc-wuzUJwF2AOb8TYrUuWSQr0PepLuRrt-SknXuXalYuX1mdOMRXqoEB3eHBgJmjRPK8EEMv0O4Vcs-v41YCY04AE6JkjtNedDvYrZ8OSvSPGuRwuGTBfKvZm1Vnns3zzCrewzk1TCpjuiWFuqLYSdHDHxrACRh0J3ZsDfBM8B6jtco0valQbJSJYT6nUEOOlECCDhvjZx_cFYzmdEp5pSNeuUDqyeaJv4SlPblHlT8BRCwWO0dh8xV-m1m97u5kvbqJEcnXg0ew"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
<div class="absolute bottom-4 left-4 flex items-center gap-2">
<span class="h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span>
<span class="text-[10px] font-mono text-tertiary-container font-bold uppercase tracking-widest">Diagnostic Visual Feed: INACTIVE</span>
</div>
</div>
</section>
</div>
</div>
</div>
<!-- Footer / Status Bar -->
<footer class="h-10 bg-surface-container px-8 flex justify-between items-center text-[10px] font-mono border-t border-outline-variant/10">
<div class="flex gap-6">
<span class="text-on-surface-variant"><span class="text-primary font-bold">OS_VERSION:</span> 4.2.1-STABLE</span>
<span class="text-on-surface-variant"><span class="text-primary font-bold">REGION:</span> GLOBAL_FALLBACK</span>
</div>
<div class="flex items-center gap-4">
<span class="text-tertiary-container font-bold flex items-center gap-2">
<span class="material-symbols-outlined text-[12px]">sync_problem</span>
                    AUTO_RECONNECT_DISABLED
                </span>
<span class="text-on-surface-variant font-bold">© 2026 SENTINEL_CORP</span>
</div>
</footer>
</main>
</body></html>