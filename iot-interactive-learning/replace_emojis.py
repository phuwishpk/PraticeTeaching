import re
import sys

def replace_emojis_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Emojis in HostView.jsx
    replacements = {
        "🚀": "<Rocket size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🧑‍🔬": "<User size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🎛️": "<Cpu size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "📶": "<Wifi size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "☁️": "<Cloud size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "⚠️": "<AlertTriangle size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🎯": "<Target size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🏆": "<Trophy size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🥇": "<Medal size='1em' color='#ffd700' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🥈": "<Medal size='1em' color='#c0c0c0' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🥉": "<Medal size='1em' color='#cd7f32' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "📖": "<BookOpen size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🎮": "<Gamepad2 size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "✅": "<CheckCircle2 size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "⏳": "<Timer size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "▶": "",
        "🔄": "<RefreshCw size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🖥": "<Monitor size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🧑": "<User size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🔬": "<Microscope size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🎛": "<Cpu size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "☁": "<Cloud size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "⚠": "<AlertTriangle size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
    }
    
    # Emojis in ClientView.jsx
    client_replacements = {
        "🔐": "<Lock size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🔓": "<Unlock size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🔥": "<Flame size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "☀": "<Sun size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "📡": "<Radio size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "⚡": "<Zap size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "💡": "<Lightbulb size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🏅": "<Medal size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🌡": "<Thermometer size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "📱": "<Smartphone size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🎉": "<PartyPopper size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "❤": "<Heart size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "❌": "<XCircle size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "👏": "<Activity size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🌱": "<Sprout size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "🚶": "<PersonStanding size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "👍": "<ThumbsUp size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />",
        "👤": "<User size='1em' style={{ display: 'inline', verticalAlign: 'text-bottom' }} />"
    }
    
    all_replacements = {**replacements, **client_replacements}
    
    icons_used = set()
    
    for emoji, icon_markup in all_replacements.items():
        if emoji in content:
            content = content.replace(emoji, icon_markup)
            
            # Extract icon name from markup
            import_match = re.search(r"<([A-Z][a-zA-Z0-9]*)", icon_markup)
            if import_match:
                icons_used.add(import_match.group(1))

    if icons_used:
        import_stmt = f"import {{ {', '.join(icons_used)} }} from 'lucide-react';\n"
        # Insert import after React import
        content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt, content, count=1)
        # If no React import matched, just prepend
        if import_stmt not in content:
            content = import_stmt + content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Processed {filepath}")

replace_emojis_in_file('src/views/HostView.jsx')
replace_emojis_in_file('src/views/ClientView.jsx')
