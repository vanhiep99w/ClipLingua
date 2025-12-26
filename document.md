# ClipLingua - AI Translator & Grammar Fixer for Ubuntu

> Production-ready AI translation & grammar correction tool powered by Groq AI

## 📋 Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
- [3. Công nghệ & Dependencies](#3-công-nghệ--dependencies)
- [4. Cài đặt môi trường](#4-cài-đặt-môi-trường)
- [5. Cấu trúc dự án](#5-cấu-trúc-dự-án)
- [6. Chi tiết implementation](#6-chi-tiết-implementation)
- [7. Bảo mật](#7-bảo-mật)
- [8. Xử lý edge cases](#8-xử-lý-edge-cases)
- [9. Tối ưu hiệu năng](#9-tối-ưu-hiệu-năng)
- [10. X11 vs Wayland](#10-x11-vs-wayland)
- [11. User Experience](#11-user-experience)
- [12. Testing](#12-testing)
- [13. Deployment](#13-deployment)
- [14. Troubleshooting](#14-troubleshooting)
- [15. Roadmap](#15-roadmap)

---

## 1. Tổng quan

### 1.1 Mục tiêu

ClipLingua là ứng dụng background service chạy trên Ubuntu, cung cấp:

- ✅ **Dịch thuật thông minh**: Anh ⇄ Việt với AI context-aware
- ✅ **Sửa ngữ pháp**: Fix typo, grammar, cải thiện câu văn tiếng Anh
- ✅ **Keyboard shortcuts**: Gọi nhanh bằng phím tắt toàn cục
- ✅ **Auto text capture**: Tự động lấy text đang select (PRIMARY selection)
- ✅ **Popup nhẹ**: Hiển thị kết quả trong GTK window minimal
- ✅ **Copy nhanh**: One-click copy kết quả
- ✅ **Zero browser**: Không phụ thuộc trình duyệt

### 1.2 Use Cases

```
┌─────────────────────────────────────────────┐
│ Scenario 1: Dịch tài liệu kỹ thuật          │
├─────────────────────────────────────────────┤
│ 1. Đọc docs tiếng Anh                       │
│ 2. Bôi đen đoạn phức tạp                    │
│ 3. Ctrl+Alt+T → Dịch sang tiếng Việt       │
│ 4. Copy và paste vào notes                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Scenario 2: Viết email chuyên nghiệp        │
├─────────────────────────────────────────────┤
│ 1. Soạn email tiếng Anh                     │
│ 2. Bôi đen draft                            │
│ 3. Ctrl+Alt+G → Sửa grammar & polish       │
│ 4. Copy văn bản đã cải thiện                │
└─────────────────────────────────────────────┘
```

---

## 2. Kiến trúc hệ thống

### 2.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    User Desktop (Ubuntu)                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐      ┌──────────────────────────┐      │
│  │ User Action │─────►│ HotkeyManager            │      │
│  │  (Select +  │      │ - Ctrl+Alt+T (Translate) │      │
│  │   Hotkey)   │      │ - Ctrl+Alt+G (Grammar)   │      │
│  └─────────────┘      └──────────┬───────────────┘      │
│                                   │                       │
│                                   ▼                       │
│                       ┌──────────────────────┐           │
│                       │ TaskOrchestrator     │           │
│                       │ - Validate input     │           │
│                       │ - Route to operation │           │
│                       └──────────┬───────────┘           │
│                                   │                       │
│         ┌─────────────────────────┼────────────┐         │
│         ▼                         ▼            ▼         │
│  ┌─────────────┐     ┌──────────────────┐  ┌─────────┐ │
│  │ Selection   │     │  GroqClient      │  │ PopupUI │ │
│  │ Manager     │     │  - API wrapper   │  │ - GTK3  │ │
│  │ - PRIMARY   │     │  - Retry logic   │  │ - Copy  │ │
│  │ - CLIPBOARD │     │  - Error handler │  │ - Close │ │
│  └─────────────┘     └────────┬─────────┘  └─────────┘ │
│                                │                         │
│                                ▼                         │
│                     ┌─────────────────────┐             │
│                     │  Groq API (HTTPS)   │             │
│                     │  llama-3.1-8b-inst  │             │
│                     └─────────────────────┘             │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                  systemd user service                     │
│            (auto-start on login, restart on crash)        │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

#### HotkeyManager
- Lắng nghe keyboard shortcuts toàn cục
- X11: sử dụng `pynput.keyboard.GlobalHotKeys`
- Wayland: delegate to DE shortcuts → DBus/CLI

#### SelectionManager
- **X11**: Đọc PRIMARY selection qua `xclip` hoặc `Gtk.Clipboard`
- **Wayland**: Đọc CLIPBOARD qua `wl-paste`
- Sanitize & validate input

#### TaskOrchestrator
- **Request lifecycle management**
  - Input validation
  - Length check (max 4000-6000 chars)
  - Language detection (if needed)
  - Queue management (tránh concurrent requests)

#### GroqClient
- Wrapper cho Groq API
- HTTP session reuse
- Retry logic (2-3 attempts với exponential backoff)
- Error classification (network / API / rate limit)
- Timeout: 10 seconds

#### PopupUI (GTK3)
- Minimal borderless window
- Always on top
- Display:
  - Title (Translation / Grammar Fix)
  - Scrollable text view
  - Copy button
  - Close button
- Keyboard shortcuts:
  - `Ctrl+C`: Copy
  - `Esc`: Close

#### ConfigManager
- Load config từ `~/.config/cliplingua/config.toml`
- Validate settings
- Support environment variables
- Hot-reload (optional)

---

## 3. Công nghệ & Dependencies

### 3.1 Tech Stack

| Component         | Technology                  |
|-------------------|-----------------------------|
| Language          | Python 3.10+                |
| UI Framework      | GTK 3 (PyGObject)           |
| Global Hotkey     | pynput (X11)                |
| Clipboard (X11)   | xclip / Gtk.Clipboard       |
| Clipboard (Wayland)| wl-clipboard (wl-paste)    |
| AI Provider       | Groq API                    |
| Model             | llama-3.1-8b-instant        |
| Config Format     | TOML                        |
| Logging           | Python logging → journald   |
| Service Manager   | systemd --user              |
| Packaging         | pip / .deb                  |

### 3.2 System Requirements

- **OS**: Ubuntu 20.04+ (X11 or Wayland)
- **Python**: 3.10+
- **Display Server**: X11 (recommended) hoặc Wayland
- **Internet**: Required (for Groq API)
- **Groq API Key**: Free tier available

---

## 4. Cài đặt môi trường

### 4.1 System Dependencies

```bash
# Update package list
sudo apt update

# Install required packages
sudo apt install -y \
  python3 \
  python3-pip \
  python3-venv \
  gir1.2-gtk-3.0 \
  xclip \
  wl-clipboard \
  libgirepository1.0-dev \
  gcc \
  libcairo2-dev \
  pkg-config \
  python3-dev
```

### 4.2 Python Environment

```bash
# Create project directory
mkdir -p ~/Projects/ClipLingua
cd ~/Projects/ClipLingua

# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python packages
pip install \
  groq==0.4.0 \
  pynput==1.7.6 \
  PyGObject==3.46.0 \
  toml==0.10.2 \
  keyring==24.2.0 \
  requests==2.31.0
```

### 4.3 Groq API Key

#### Option A: Environment Variable

```bash
# Add to ~/.bashrc or ~/.zshrc
export GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxx"

# Reload
source ~/.bashrc
```

#### Option B: Keyring (Recommended)

```python
# One-time setup
import keyring
keyring.set_password("cliplingua", "groq_api_key", "gsk_xxxxxxxxxxxx")
```

#### Option C: Config File

```bash
# Create config directory
mkdir -p ~/.config/cliplingua

# Create config file
cat > ~/.config/cliplingua/config.toml << 'EOF'
[groq]
api_key = "gsk_xxxxxxxxxxxxxxxxxxxx"
model = "llama-3.1-8b-instant"
timeout = 10
max_retries = 3

[ui]
window_width = 500
window_height = 300
font_size = 12

[hotkeys]
translate = "<ctrl>+<alt>+t"
grammar = "<ctrl>+<alt>+g"

[limits]
max_chars = 4000
EOF

# Secure permissions
chmod 600 ~/.config/cliplingua/config.toml
```

---

## 5. Cấu trúc dự án

```
cliplingua/
├── cliplingua/
│   ├── __init__.py
│   ├── main.py                  # Entry point
│   ├── config.py                # Config management
│   ├── core/
│   │   ├── __init__.py
│   │   ├── orchestrator.py      # Task orchestrator
│   │   ├── hotkey_manager.py    # Hotkey listener
│   │   └── selection_manager.py # Clipboard/selection
│   ├── services/
│   │   ├── __init__.py
│   │   ├── groq_client.py       # Groq API wrapper
│   │   └── prompts.py           # Prompt templates
│   ├── ui/
│   │   ├── __init__.py
│   │   └── popup.py             # GTK popup window
│   └── utils/
│       ├── __init__.py
│       ├── logger.py            # Logging setup
│       └── validators.py        # Input validation
├── bin/
│   ├── cliplingua-daemon        # Main daemon
│   └── cliplingua-action        # CLI trigger
├── systemd/
│   └── cliplingua.service       # systemd unit file
├── tests/
│   ├── test_config.py
│   ├── test_groq_client.py
│   ├── test_prompts.py
│   └── test_validators.py
├── docs/
│   ├── ARCHITECTURE.md
│   ├── WAYLAND.md
│   └── TROUBLESHOOTING.md
├── pyproject.toml
├── setup.cfg
├── README.md
├── LICENSE
└── .gitignore
```

---

## 6. Chi tiết Implementation

### 6.1 Config Management (`config.py`)

```python
import os
import toml
import keyring
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

@dataclass
class GroqConfig:
    api_key: str
    model: str = "llama-3.1-8b-instant"
    timeout: int = 10
    max_retries: int = 3

@dataclass
class HotkeyConfig:
    translate: str = "<ctrl>+<alt>+t"
    grammar: str = "<ctrl>+<alt>+g"

@dataclass
class LimitsConfig:
    max_chars: int = 4000

@dataclass
class UIConfig:
    window_width: int = 500
    window_height: int = 300
    font_size: int = 12

@dataclass
class Config:
    groq: GroqConfig
    hotkeys: HotkeyConfig
    limits: LimitsConfig
    ui: UIConfig

class ConfigManager:
    CONFIG_DIR = Path.home() / ".config" / "cliplingua"
    CONFIG_FILE = CONFIG_DIR / "config.toml"
    
    @classmethod
    def load(cls) -> Config:
        """Load configuration from multiple sources (priority order):
        1. Environment variables
        2. Keyring
        3. Config file
        """
        # Ensure config directory exists
        cls.CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        
        # Load from file if exists
        if cls.CONFIG_FILE.exists():
            data = toml.load(cls.CONFIG_FILE)
        else:
            data = cls._create_default_config()
        
        # Override API key from environment or keyring
        api_key = cls._get_api_key(data.get("groq", {}).get("api_key"))
        
        groq_config = GroqConfig(
            api_key=api_key,
            model=data.get("groq", {}).get("model", "llama-3.1-8b-instant"),
            timeout=data.get("groq", {}).get("timeout", 10),
            max_retries=data.get("groq", {}).get("max_retries", 3)
        )
        
        hotkeys_config = HotkeyConfig(
            translate=data.get("hotkeys", {}).get("translate", "<ctrl>+<alt>+t"),
            grammar=data.get("hotkeys", {}).get("grammar", "<ctrl>+<alt>+g")
        )
        
        limits_config = LimitsConfig(
            max_chars=data.get("limits", {}).get("max_chars", 4000)
        )
        
        ui_config = UIConfig(
            window_width=data.get("ui", {}).get("window_width", 500),
            window_height=data.get("ui", {}).get("window_height", 300),
            font_size=data.get("ui", {}).get("font_size", 12)
        )
        
        return Config(
            groq=groq_config,
            hotkeys=hotkeys_config,
            limits=limits_config,
            ui=ui_config
        )
    
    @classmethod
    def _get_api_key(cls, default: Optional[str] = None) -> str:
        """Get API key from environment, keyring, or config file"""
        # 1. Environment variable
        env_key = os.getenv("GROQ_API_KEY")
        if env_key:
            return env_key
        
        # 2. Keyring
        try:
            keyring_key = keyring.get_password("cliplingua", "groq_api_key")
            if keyring_key:
                return keyring_key
        except Exception:
            pass
        
        # 3. Config file
        if default:
            return default
        
        raise ValueError(
            "GROQ_API_KEY not found. Set via:\n"
            "  1. Environment: export GROQ_API_KEY='gsk_xxx'\n"
            "  2. Keyring: cliplingua-config set-key\n"
            "  3. Config file: ~/.config/cliplingua/config.toml"
        )
    
    @classmethod
    def _create_default_config(cls) -> dict:
        """Create default config file"""
        default = {
            "groq": {
                "model": "llama-3.1-8b-instant",
                "timeout": 10,
                "max_retries": 3
            },
            "hotkeys": {
                "translate": "<ctrl>+<alt>+t",
                "grammar": "<ctrl>+<alt>+g"
            },
            "limits": {
                "max_chars": 4000
            },
            "ui": {
                "window_width": 500,
                "window_height": 300,
                "font_size": 12
            }
        }
        
        with open(cls.CONFIG_FILE, "w") as f:
            toml.dump(default, f)
        
        # Secure permissions
        os.chmod(cls.CONFIG_FILE, 0o600)
        
        return default
```

### 6.2 Selection Manager (`core/selection_manager.py`)

```python
import subprocess
import os
from typing import Optional

class SelectionManager:
    """Handle text selection from clipboard/PRIMARY selection"""
    
    def __init__(self):
        self.session_type = os.getenv("XDG_SESSION_TYPE", "x11")
    
    def get_selected_text(self) -> str:
        """Get currently selected text based on session type"""
        if self.session_type == "wayland":
            return self._get_wayland_clipboard()
        else:
            return self._get_x11_primary()
    
    def _get_x11_primary(self) -> str:
        """Get PRIMARY selection on X11"""
        try:
            result = subprocess.run(
                ["xclip", "-o", "-selection", "primary"],
                capture_output=True,
                text=True,
                timeout=2,
                check=False
            )
            return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            # Fallback to CLIPBOARD
            return self._get_x11_clipboard()
        except Exception:
            return ""
    
    def _get_x11_clipboard(self) -> str:
        """Get CLIPBOARD on X11"""
        try:
            result = subprocess.run(
                ["xclip", "-o", "-selection", "clipboard"],
                capture_output=True,
                text=True,
                timeout=2,
                check=False
            )
            return result.stdout.strip()
        except Exception:
            return ""
    
    def _get_wayland_clipboard(self) -> str:
        """Get clipboard on Wayland using wl-paste"""
        try:
            result = subprocess.run(
                ["wl-paste", "-n"],
                capture_output=True,
                text=True,
                timeout=2,
                check=False
            )
            return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return ""
        except Exception:
            return ""
    
    @staticmethod
    def copy_to_clipboard(text: str) -> bool:
        """Copy text to clipboard"""
        session_type = os.getenv("XDG_SESSION_TYPE", "x11")
        
        try:
            if session_type == "wayland":
                subprocess.run(
                    ["wl-copy"],
                    input=text.encode(),
                    timeout=2,
                    check=True
                )
            else:
                subprocess.run(
                    ["xclip", "-selection", "clipboard"],
                    input=text.encode(),
                    timeout=2,
                    check=True
                )
            return True
        except Exception:
            return False
```

### 6.3 Groq Client (`services/groq_client.py`)

```python
import time
from typing import Optional
from groq import Groq, APIError, RateLimitError, APIConnectionError
from ..config import GroqConfig
from ..utils.logger import get_logger

logger = get_logger(__name__)

class GroqClient:
    """Wrapper for Groq API with retry logic and error handling"""
    
    def __init__(self, config: GroqConfig):
        self.config = config
        self.client = Groq(api_key=config.api_key)
    
    def ask(self, prompt: str, temperature: float = 0.2) -> str:
        """Send prompt to Groq with retry logic"""
        for attempt in range(self.config.max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.config.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    timeout=self.config.timeout
                )
                
                result = response.choices[0].message.content.strip()
                logger.info(f"Groq API success (attempt {attempt + 1})")
                return result
                
            except RateLimitError as e:
                logger.warning(f"Rate limit hit: {e}")
                if attempt < self.config.max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise GroqClientError("Rate limit exceeded. Please try again later.")
            
            except APIConnectionError as e:
                logger.error(f"Network error: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(1)
                else:
                    raise GroqClientError("Unable to reach Groq API. Check your internet connection.")
            
            except APIError as e:
                logger.error(f"API error: {e}")
                raise GroqClientError(f"Groq API error: {str(e)}")
            
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise GroqClientError(f"Unexpected error: {str(e)}")
        
        raise GroqClientError("Max retries exceeded")

class GroqClientError(Exception):
    """Custom exception for Groq client errors"""
    pass
```

### 6.4 Prompts (`services/prompts.py`)

```python
class Prompts:
    """Prompt templates for different operations"""
    
    FIX_GRAMMAR = """You are an expert English writing assistant.

Your task:
- Fix all grammar mistakes
- Correct spelling errors
- Improve clarity and flow
- Make the text more professional
- DO NOT change the core meaning
- DO NOT add new information

Return ONLY the corrected text, no explanations.

Text:
{input}
"""
    
    TRANSLATE_EN_VI = """You are a professional English-Vietnamese translator.

Your task:
- Translate the following English text into natural, fluent Vietnamese
- Preserve the tone and style of the original
- Use appropriate Vietnamese expressions
- Keep technical terms accurate
- Return ONLY the Vietnamese translation, no explanations

Text:
{input}
"""
    
    TRANSLATE_VI_EN = """You are a professional Vietnamese-English translator.

Your task:
- Translate the following Vietnamese text into natural, fluent English
- Preserve the tone and style of the original
- Use appropriate English expressions
- Fix any grammar issues in the translation
- Return ONLY the English translation, no explanations

Text:
{input}
"""
    
    AUTO_TRANSLATE = """You are a bilingual English-Vietnamese translator.

Detect the language of the input text:
- If English → translate to Vietnamese
- If Vietnamese → translate to English

Use natural, fluent language. Return ONLY the translation.

Text:
{input}
"""
    
    @classmethod
    def get_prompt(cls, operation: str, text: str) -> str:
        """Get formatted prompt for operation"""
        prompts = {
            "grammar": cls.FIX_GRAMMAR,
            "translate_en_vi": cls.TRANSLATE_EN_VI,
            "translate_vi_en": cls.TRANSLATE_VI_EN,
            "auto_translate": cls.AUTO_TRANSLATE
        }
        
        template = prompts.get(operation)
        if not template:
            raise ValueError(f"Unknown operation: {operation}")
        
        return template.format(input=text)
```

### 6.5 Popup UI (`ui/popup.py`)

```python
import gi
gi.require_version("Gtk", "3.0")
from gi.repository import Gtk, Gdk, GLib
from ..core.selection_manager import SelectionManager
from ..utils.logger import get_logger

logger = get_logger(__name__)

class ResultPopup(Gtk.Window):
    """GTK popup window for displaying results"""
    
    def __init__(self, title: str, text: str, config):
        super().__init__(title=f"ClipLingua - {title}")
        
        self.config = config
        self.setup_window()
        self.build_ui(text)
        self.connect_signals()
        
    def setup_window(self):
        """Configure window properties"""
        self.set_default_size(
            self.config.ui.window_width,
            self.config.ui.window_height
        )
        self.set_keep_above(True)
        self.set_decorated(True)
        self.set_position(Gtk.WindowPosition.CENTER)
        
        # Set window icon (if available)
        try:
            self.set_icon_from_file("/usr/share/icons/hicolor/48x48/apps/cliplingua.png")
        except:
            pass
    
    def build_ui(self, text: str):
        """Build UI components"""
        # Main container
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        vbox.set_margin_top(10)
        vbox.set_margin_bottom(10)
        vbox.set_margin_start(10)
        vbox.set_margin_end(10)
        self.add(vbox)
        
        # Text view (scrollable)
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll.set_vexpand(True)
        
        self.textview = Gtk.TextView()
        self.textview.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        self.textview.set_editable(False)
        self.textview.set_cursor_visible(False)
        
        # Set font size
        css_provider = Gtk.CssProvider()
        css = f"textview {{ font-size: {self.config.ui.font_size}pt; }}"
        css_provider.load_from_data(css.encode())
        context = self.textview.get_style_context()
        context.add_provider(css_provider, Gtk.STYLE_PROVIDER_PRIORITY_USER)
        
        buffer = self.textview.get_buffer()
        buffer.set_text(text)
        
        scroll.add(self.textview)
        vbox.pack_start(scroll, True, True, 0)
        
        # Button box
        button_box = Gtk.Box(spacing=6)
        button_box.set_halign(Gtk.Align.END)
        
        # Copy button
        self.copy_btn = Gtk.Button(label="📋 Copy")
        self.copy_btn.connect("clicked", self.on_copy)
        button_box.pack_start(self.copy_btn, False, False, 0)
        
        # Close button
        close_btn = Gtk.Button(label="✕ Close")
        close_btn.connect("clicked", lambda _: self.close())
        button_box.pack_start(close_btn, False, False, 0)
        
        vbox.pack_start(button_box, False, False, 0)
    
    def connect_signals(self):
        """Connect keyboard shortcuts"""
        self.connect("key-press-event", self.on_key_press)
    
    def on_copy(self, widget):
        """Copy text to clipboard"""
        buffer = self.textview.get_buffer()
        start, end = buffer.get_bounds()
        text = buffer.get_text(start, end, False)
        
        if SelectionManager.copy_to_clipboard(text):
            logger.info("Text copied to clipboard")
            # Visual feedback
            self.copy_btn.set_label("✓ Copied!")
            GLib.timeout_add(1500, self._reset_copy_button)
        else:
            logger.error("Failed to copy text")
            self.copy_btn.set_label("✗ Failed")
            GLib.timeout_add(1500, self._reset_copy_button)
    
    def _reset_copy_button(self):
        """Reset copy button label"""
        self.copy_btn.set_label("📋 Copy")
        return False
    
    def on_key_press(self, widget, event):
        """Handle keyboard shortcuts"""
        # Ctrl+C: Copy
        if event.state & Gdk.ModifierType.CONTROL_MASK and event.keyval == Gdk.KEY_c:
            self.on_copy(None)
            return True
        
        # Escape: Close
        if event.keyval == Gdk.KEY_Escape:
            self.close()
            return True
        
        return False

class LoadingPopup(Gtk.Window):
    """Simple loading indicator"""
    
    def __init__(self, operation: str):
        super().__init__(title="ClipLingua")
        
        self.set_default_size(300, 100)
        self.set_keep_above(True)
        self.set_decorated(False)
        self.set_position(Gtk.WindowPosition.CENTER)
        
        # Container
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        vbox.set_margin_top(20)
        vbox.set_margin_bottom(20)
        vbox.set_margin_start(20)
        vbox.set_margin_end(20)
        self.add(vbox)
        
        # Spinner
        spinner = Gtk.Spinner()
        spinner.start()
        vbox.pack_start(spinner, False, False, 0)
        
        # Label
        label = Gtk.Label(label=f"Processing: {operation}...")
        vbox.pack_start(label, False, False, 0)
```

### 6.6 Hotkey Manager (`core/hotkey_manager.py`)

```python
import os
from pynput import keyboard
from ..utils.logger import get_logger

logger = get_logger(__name__)

class HotkeyManager:
    """Manage global keyboard shortcuts"""
    
    def __init__(self, config, on_translate, on_grammar):
        self.config = config
        self.on_translate = on_translate
        self.on_grammar = on_grammar
        self.session_type = os.getenv("XDG_SESSION_TYPE", "x11")
    
    def start(self):
        """Start listening for hotkeys"""
        if self.session_type == "wayland":
            logger.warning(
                "Wayland detected. Global hotkeys not supported.\n"
                "Configure keyboard shortcuts in your desktop environment:\n"
                f"  Translate: {self.config.hotkeys.translate} → cliplingua-action translate\n"
                f"  Grammar: {self.config.hotkeys.grammar} → cliplingua-action grammar"
            )
            return
        
        logger.info(f"Starting hotkey listener (X11)")
        logger.info(f"  Translate: {self.config.hotkeys.translate}")
        logger.info(f"  Grammar: {self.config.hotkeys.grammar}")
        
        try:
            hotkeys = {
                self.config.hotkeys.translate: self._wrap_callback(self.on_translate),
                self.config.hotkeys.grammar: self._wrap_callback(self.on_grammar)
            }
            
            with keyboard.GlobalHotKeys(hotkeys) as listener:
                listener.join()
                
        except Exception as e:
            logger.error(f"Hotkey listener error: {e}")
            raise
    
    def _wrap_callback(self, callback):
        """Wrap callback with error handling"""
        def wrapper():
            try:
                callback()
            except Exception as e:
                logger.error(f"Hotkey callback error: {e}")
        return wrapper
```

---

## 7. Bảo mật

### 7.1 API Key Security

#### ✅ Best Practices

1. **Environment Variables** (Recommended)
   ```bash
   export GROQ_API_KEY="gsk_xxxx"
   ```

2. **OS Keyring** (Most secure)
   ```python
   import keyring
   keyring.set_password("cliplingua", "groq_api_key", "gsk_xxx")
   ```

3. **Config File với permissions**
   ```bash
   chmod 600 ~/.config/cliplingua/config.toml
   ```

#### ❌ Anti-patterns

- ❌ Hardcode API key trong source code
- ❌ Commit API key lên Git
- ❌ Config file với world-readable permissions
- ❌ Log API key trong logs

### 7.2 Data Privacy

- **Selected text = sensitive data**
  - User có thể select passwords, tokens, private info
  
- **Policies**:
  - ✅ Never log full text content
  - ✅ Log chỉ metadata (length, first 20 chars)
  - ✅ Document rõ: "Text is sent to Groq servers"
  - ✅ Consider thêm "local-only mode" với local LLM

### 7.3 Network Security

- ✅ Always HTTPS (Groq client default)
- ✅ Certificate validation enabled
- ✅ Timeout để avoid hanging (10s)
- ✅ No shell injection (subprocess args are static)

---

## 8. Xử lý Edge Cases

### 8.1 Input Validation

```python
# utils/validators.py
class InputValidator:
    """Validate user input"""
    
    @staticmethod
    def validate_text(text: str, max_chars: int = 4000) -> tuple[bool, str]:
        """Validate selected text
        
        Returns:
            (is_valid, error_message)
        """
        # Empty check
        if not text or not text.strip():
            return False, "No text selected"
        
        # Length check
        if len(text) > max_chars:
            return False, f"Text too long ({len(text)} chars). Max: {max_chars}"
        
        # Unicode check
        try:
            text.encode('utf-8')
        except UnicodeEncodeError:
            return False, "Invalid characters in text"
        
        return True, ""
```

### 8.2 Error Scenarios

| Scenario | Detection | Response |
|----------|-----------|----------|
| No selection | Empty string | Popup: "Please select text first" |
| Text too long | len(text) > 4000 | Popup: "Text too long (N chars). Max: 4000" |
| Network error | `APIConnectionError` | Popup: "Network error. Check connection." |
| Rate limit | HTTP 429 | Popup: "Rate limit. Wait a moment." |
| Invalid API key | HTTP 401 | Popup: "Invalid API key. Check config." |
| xclip missing | `FileNotFoundError` | Popup: "Install xclip: sudo apt install xclip" |
| Concurrent requests | Queue check | Show "Processing..." or queue |

### 8.3 Robust Error Handling Pattern

```python
def handle_operation(operation_type: str):
    """Main operation handler with complete error handling"""
    try:
        # 1. Get selection
        text = selection_manager.get_selected_text()
        
        # 2. Validate
        is_valid, error = InputValidator.validate_text(text, config.limits.max_chars)
        if not is_valid:
            show_error_popup(error)
            return
        
        # 3. Show loading
        loading = LoadingPopup(operation_type)
        loading.show_all()
        
        # 4. API call
        try:
            prompt = Prompts.get_prompt(operation_type, text)
            result = groq_client.ask(prompt)
            loading.close()
            
            # 5. Show result
            ResultPopup(operation_type.title(), result, config).show_all()
            
        except GroqClientError as e:
            loading.close()
            show_error_popup(str(e))
            
    except Exception as e:
        logger.exception("Unexpected error in operation handler")
        show_error_popup(f"Unexpected error: {str(e)}")
```

---

## 9. Tối ưu hiệu năng

### 9.1 API Optimization

```python
class GroqClient:
    def __init__(self, config: GroqConfig):
        self.config = config
        # Reuse HTTP session
        self.client = Groq(api_key=config.api_key)
        
    def ask(self, prompt: str, temperature: float = 0.2) -> str:
        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=1024,  # Limit output
            timeout=self.config.timeout
        )
        return response.choices[0].message.content.strip()
```

### 9.2 UI Responsiveness

```python
import threading
from gi.repository import GLib

def async_operation(operation_func):
    """Decorator to run operation in background thread"""
    def wrapper(*args, **kwargs):
        def run():
            try:
                result = operation_func(*args, **kwargs)
                GLib.idle_add(on_success, result)
            except Exception as e:
                GLib.idle_add(on_error, str(e))
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
    
    return wrapper

@async_operation
def process_translation(text):
    return groq_client.ask(Prompts.get_prompt("auto_translate", text))
```

### 9.3 Resource Management

- ✅ Single daemon process (không spawn subprocesses nhiều lần)
- ✅ Reuse GTK windows (hide/show thay vì create/destroy)
- ✅ HTTP session pooling
- ✅ Lazy loading modules
- ✅ Minimal memory footprint (~50MB idle)

---

## 10. X11 vs Wayland

### 10.1 Detection

```python
import os

def detect_session_type():
    """Detect X11 or Wayland"""
    session_type = os.getenv("XDG_SESSION_TYPE", "").lower()
    
    if session_type == "wayland":
        return "wayland"
    elif session_type == "x11":
        return "x11"
    else:
        # Fallback: check for Wayland display
        if os.getenv("WAYLAND_DISPLAY"):
            return "wayland"
        return "x11"
```

### 10.2 Feature Matrix

| Feature | X11 | Wayland |
|---------|-----|---------|
| PRIMARY selection | ✅ `xclip -selection primary` | ❌ Not standardized |
| CLIPBOARD | ✅ `xclip -selection clipboard` | ✅ `wl-paste` |
| Global hotkeys | ✅ `pynput` | ❌ Security restricted |
| Workaround | N/A | DE shortcuts → CLI/DBus |

### 10.3 Wayland Adaptation

#### Strategy: Delegate to Desktop Environment

```bash
# GNOME Settings > Keyboard > Custom Shortcuts
# Add:
Name: ClipLingua Translate
Command: /usr/local/bin/cliplingua-action translate
Shortcut: Ctrl+Alt+T

Name: ClipLingua Grammar
Command: /usr/local/bin/cliplingua-action grammar
Shortcut: Ctrl+Alt+G
```

#### CLI Action Tool (`bin/cliplingua-action`)

```python
#!/usr/bin/env python3
"""CLI tool to trigger ClipLingua actions"""
import sys
import dbus

def send_dbus_action(action: str):
    """Send action to running daemon via DBus"""
    try:
        bus = dbus.SessionBus()
        proxy = bus.get_object('com.cliplingua.Daemon', '/com/cliplingua/Daemon')
        interface = dbus.Interface(proxy, 'com.cliplingua.Actions')
        interface.Trigger(action)
    except dbus.DBusException as e:
        print(f"Error: ClipLingua daemon not running", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: cliplingua-action {translate|grammar}")
        sys.exit(1)
    
    action = sys.argv[1]
    if action not in ["translate", "grammar"]:
        print(f"Unknown action: {action}")
        sys.exit(1)
    
    send_dbus_action(action)
```

### 10.4 First-run Wayland Notice

```python
def show_wayland_notice():
    """Show one-time notice for Wayland users"""
    notice_file = Path.home() / ".config/cliplingua/.wayland-notice-shown"
    
    if not notice_file.exists():
        dialog = Gtk.MessageDialog(
            message_type=Gtk.MessageType.INFO,
            buttons=Gtk.ButtonsType.OK,
            text="Wayland Detected"
        )
        dialog.format_secondary_text(
            "ClipLingua requires manual keyboard shortcut setup on Wayland.\n\n"
            "Please configure in Settings > Keyboard > Custom Shortcuts:\n"
            "  • Translate: Ctrl+Alt+T → cliplingua-action translate\n"
            "  • Grammar: Ctrl+Alt+G → cliplingua-action grammar\n\n"
            "Also: Copy text (Ctrl+C) before using shortcuts."
        )
        dialog.run()
        dialog.destroy()
        
        notice_file.parent.mkdir(parents=True, exist_ok=True)
        notice_file.touch()
```

---

## 11. User Experience

### 11.1 Workflow

```
┌────────────────────────────────────────┐
│ 1. User selects text                   │
│    "The quick brown fox jumps..."      │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 2. Press Ctrl+Alt+T (Translate)        │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 3. Loading popup appears (0.5s)        │
│    "Processing: Auto Translate..."     │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 4. Result popup (2-3s later)           │
│ ┌────────────────────────────────────┐ │
│ │ ClipLingua - Translation           │ │
│ ├────────────────────────────────────┤ │
│ │ Con cáo nâu nhanh nhẹn nhảy...     │ │
│ │                                    │ │
│ │               [📋 Copy]  [✕ Close] │ │
│ └────────────────────────────────────┘ │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 5. User clicks Copy or presses Ctrl+C  │
│    → Text copied to clipboard          │
└────────────────────────────────────────┘
```

### 11.2 Visual Feedback

- **Loading state**: Spinner + "Processing..." message
- **Success**: Result text + "Copy" button
- **Error**: Red text + clear error message + suggested fix
- **Copy feedback**: Button changes to "✓ Copied!" for 1.5s

### 11.3 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+T` | Translate (auto-detect direction) |
| `Ctrl+Alt+G` | Fix grammar |
| `Ctrl+C` | Copy result (when popup focused) |
| `Esc` | Close popup |

---

## 12. Testing

### 12.1 Unit Tests

```python
# tests/test_validators.py
import pytest
from cliplingua.utils.validators import InputValidator

def test_empty_text():
    valid, error = InputValidator.validate_text("")
    assert not valid
    assert "No text selected" in error

def test_long_text():
    text = "a" * 5000
    valid, error = InputValidator.validate_text(text, max_chars=4000)
    assert not valid
    assert "too long" in error

def test_valid_text():
    valid, error = InputValidator.validate_text("Hello world")
    assert valid
    assert error == ""
```

```python
# tests/test_prompts.py
from cliplingua.services.prompts import Prompts

def test_grammar_prompt():
    text = "i are good"
    prompt = Prompts.get_prompt("grammar", text)
    assert "grammar" in prompt.lower()
    assert text in prompt

def test_translate_prompt():
    text = "Hello"
    prompt = Prompts.get_prompt("auto_translate", text)
    assert text in prompt
```

### 12.2 Integration Tests

```bash
# Test với mocked Groq API
pytest tests/ --cov=cliplingua

# Test clipboard (X11)
xvfb-run pytest tests/test_selection_manager.py
```

### 12.3 Manual Testing Checklist

- [ ] X11: Hotkeys work
- [ ] X11: PRIMARY selection captured
- [ ] X11: CLIPBOARD fallback works
- [ ] Wayland: CLI action triggers work
- [ ] Wayland: CLIPBOARD read works
- [ ] Network error shows clear message
- [ ] Very long text rejected with message
- [ ] Empty selection shows warning
- [ ] Copy button works
- [ ] Keyboard shortcuts (Ctrl+C, Esc) work
- [ ] systemd service starts on login
- [ ] systemd service restarts after crash

---

## 13. Deployment

### 13.1 systemd Service

```ini
# ~/.config/systemd/user/cliplingua.service
[Unit]
Description=ClipLingua AI Translation Service
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cliplingua-daemon
Restart=on-failure
RestartSec=5
Environment="GROQ_API_KEY=%GROQ_API_KEY%"

# Security
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
NoNewPrivileges=true

[Install]
WantedBy=default.target
```

```bash
# Enable and start
systemctl --user daemon-reload
systemctl --user enable cliplingua.service
systemctl --user start cliplingua.service

# Check status
systemctl --user status cliplingua.service

# View logs
journalctl --user -u cliplingua.service -f
```

### 13.2 Packaging

#### Option A: pip install

```bash
# pyproject.toml
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "cliplingua"
version = "1.0.0"
authors = [{name = "Your Name", email = "you@example.com"}]
description = "AI Translation & Grammar Fixer for Ubuntu"
requires-python = ">=3.10"
dependencies = [
    "groq>=0.4.0",
    "pynput>=1.7.6",
    "PyGObject>=3.46.0",
    "toml>=0.10.2",
    "keyring>=24.2.0"
]

[project.scripts]
cliplingua-daemon = "cliplingua.main:main"
cliplingua-action = "cliplingua.cli:main"

# Install
pip install -e .
```

#### Option B: .deb package

```bash
# Create package structure
mkdir -p cliplingua-deb/DEBIAN
mkdir -p cliplingua-deb/usr/local/bin
mkdir -p cliplingua-deb/usr/share/applications
mkdir -p cliplingua-deb/etc/systemd/user

# DEBIAN/control
cat > cliplingua-deb/DEBIAN/control << 'EOF'
Package: cliplingua
Version: 1.0.0
Architecture: all
Maintainer: Your Name <you@example.com>
Depends: python3 (>= 3.10), python3-gi, xclip, wl-clipboard
Description: AI Translation & Grammar Fixer
 Translate and fix grammar using Groq AI
EOF

# Build
dpkg-deb --build cliplingua-deb

# Install
sudo dpkg -i cliplingua-deb.deb
```

### 13.3 Installation Script

```bash
#!/bin/bash
# install.sh

set -e

echo "=== ClipLingua Installation ==="

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "Warning: This tool is designed for Ubuntu"
fi

# Install system dependencies
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv gir1.2-gtk-3.0 xclip wl-clipboard

# Create venv
echo "Creating Python virtual environment..."
python3 -m venv ~/.local/share/cliplingua/venv

# Install Python packages
echo "Installing Python packages..."
~/.local/share/cliplingua/venv/bin/pip install -q --upgrade pip
~/.local/share/cliplingua/venv/bin/pip install -q groq pynput PyGObject toml keyring

# Install scripts
echo "Installing scripts..."
sudo ln -sf ~/.local/share/cliplingua/venv/bin/cliplingua-daemon /usr/local/bin/
sudo ln -sf ~/.local/share/cliplingua/venv/bin/cliplingua-action /usr/local/bin/

# Setup systemd service
echo "Setting up systemd service..."
mkdir -p ~/.config/systemd/user
cp systemd/cliplingua.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable cliplingua.service

# Prompt for API key
echo ""
echo "Enter your Groq API key:"
read -s GROQ_API_KEY
export GROQ_API_KEY

# Start service
echo "Starting ClipLingua..."
systemctl --user start cliplingua.service

echo ""
echo "✓ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Set your API key: export GROQ_API_KEY='your-key'"
echo "  2. Test: Select some text and press Ctrl+Alt+T"
echo ""
echo "View logs: journalctl --user -u cliplingua.service -f"
```

---

## 14. Troubleshooting

### 14.1 Common Issues

#### Issue: Hotkeys not working

**Possible causes**:
- Running on Wayland (hotkeys not supported)
- Conflicting keyboard shortcuts
- pynput not installed correctly

**Solutions**:
```bash
# Check session type
echo $XDG_SESSION_TYPE

# If Wayland: setup DE shortcuts
# Settings > Keyboard > Custom Shortcuts

# If X11: check conflicts
gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings

# Test pynput
python3 -c "from pynput import keyboard; print('OK')"
```

#### Issue: "No text selected" always shown

**Possible causes**:
- xclip/wl-clipboard not installed
- PRIMARY selection empty (on X11)

**Solutions**:
```bash
# Install clipboard tools
sudo apt install xclip wl-clipboard

# Test manually
xclip -o -selection primary
wl-paste
```

#### Issue: "Network error" or timeouts

**Possible causes**:
- No internet connection
- Groq API down
- Firewall blocking

**Solutions**:
```bash
# Test connectivity
curl -I https://api.groq.com

# Check API key
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models

# Increase timeout in config
# ~/.config/cliplingua/config.toml
[groq]
timeout = 30
```

#### Issue: Service crashes on startup

**Check logs**:
```bash
journalctl --user -u cliplingua.service -n 50

# Common errors:
# - Missing API key
# - Python import errors
# - GTK display issues
```

### 14.2 Debug Mode

```python
# Enable debug logging
# ~/.config/cliplingua/config.toml
[logging]
level = "DEBUG"

# Or via environment
export CLIPLINGUA_DEBUG=1
```

---

## 15. Roadmap

### Phase 1: MVP ✅
- [x] Basic translate (En ⇄ Vi)
- [x] Grammar fix
- [x] Hotkeys (X11)
- [x] GTK popup
- [x] Copy button

### Phase 2: Enhancement 🚧
- [ ] Auto language detection
- [ ] Translation history
- [ ] Custom prompts
- [ ] Multiple AI providers (OpenAI, Claude)
- [ ] Streaming responses
- [ ] Tray icon with quick settings

### Phase 3: Advanced 🔮
- [ ] OCR support (translate text in images)
- [ ] TTS (text-to-speech)
- [ ] Local LLM option (Ollama)
- [ ] Browser extension integration
- [ ] Mobile companion app
- [ ] Team sharing (translation memory)

---

## Appendix A: Complete File Listing

### Main Entry Point

```python
# cliplingua/main.py
import sys
import gi
gi.require_version("Gtk", "3.0")
from gi.repository import Gtk, GLib

from .config import ConfigManager
from .core.orchestrator import TaskOrchestrator
from .core.hotkey_manager import HotkeyManager
from .services.groq_client import GroqClient
from .utils.logger import setup_logging

def main():
    # Setup logging
    logger = setup_logging()
    logger.info("Starting ClipLingua daemon...")
    
    try:
        # Load config
        config = ConfigManager.load()
        
        # Initialize components
        groq_client = GroqClient(config.groq)
        orchestrator = TaskOrchestrator(config, groq_client)
        
        # Start hotkey manager (if X11)
        hotkey_manager = HotkeyManager(
            config,
            on_translate=lambda: orchestrator.handle_translate(),
            on_grammar=lambda: orchestrator.handle_grammar()
        )
        
        # Start GTK main loop in main thread
        GLib.idle_add(hotkey_manager.start)
        Gtk.main()
        
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        sys.exit(0)
    except Exception as e:
        logger.exception("Fatal error")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Orchestrator

```python
# cliplingua/core/orchestrator.py
import threading
from gi.repository import GLib, Gtk
from ..core.selection_manager import SelectionManager
from ..services.prompts import Prompts
from ..services.groq_client import GroqClientError
from ..ui.popup import ResultPopup, LoadingPopup
from ..utils.validators import InputValidator
from ..utils.logger import get_logger

logger = get_logger(__name__)

class TaskOrchestrator:
    """Orchestrate translation/grammar operations"""
    
    def __init__(self, config, groq_client):
        self.config = config
        self.groq_client = groq_client
        self.selection_manager = SelectionManager()
        self.loading_popup = None
    
    def handle_translate(self):
        """Handle translation request"""
        self._handle_operation("auto_translate", "Translation")
    
    def handle_grammar(self):
        """Handle grammar fix request"""
        self._handle_operation("grammar", "Grammar Fix")
    
    def _handle_operation(self, operation_type: str, title: str):
        """Generic operation handler"""
        # Get selected text
        text = self.selection_manager.get_selected_text()
        
        # Validate
        is_valid, error = InputValidator.validate_text(text, self.config.limits.max_chars)
        if not is_valid:
            GLib.idle_add(self._show_error, error)
            return
        
        # Show loading
        GLib.idle_add(self._show_loading, title)
        
        # Process in background thread
        thread = threading.Thread(
            target=self._process_async,
            args=(operation_type, title, text),
            daemon=True
        )
        thread.start()
    
    def _process_async(self, operation_type: str, title: str, text: str):
        """Process request asynchronously"""
        try:
            # Get prompt
            prompt = Prompts.get_prompt(operation_type, text)
            
            # Call API
            result = self.groq_client.ask(prompt)
            
            # Show result
            GLib.idle_add(self._show_result, title, result)
            
        except GroqClientError as e:
            GLib.idle_add(self._show_error, str(e))
        except Exception as e:
            logger.exception("Unexpected error")
            GLib.idle_add(self._show_error, f"Unexpected error: {str(e)}")
    
    def _show_loading(self, title: str):
        """Show loading popup"""
        if self.loading_popup:
            self.loading_popup.destroy()
        
        self.loading_popup = LoadingPopup(title)
        self.loading_popup.show_all()
    
    def _show_result(self, title: str, text: str):
        """Show result popup"""
        if self.loading_popup:
            self.loading_popup.destroy()
            self.loading_popup = None
        
        popup = ResultPopup(title, text, self.config)
        popup.show_all()
    
    def _show_error(self, error: str):
        """Show error dialog"""
        if self.loading_popup:
            self.loading_popup.destroy()
            self.loading_popup = None
        
        dialog = Gtk.MessageDialog(
            message_type=Gtk.MessageType.ERROR,
            buttons=Gtk.ButtonsType.OK,
            text="ClipLingua Error"
        )
        dialog.format_secondary_text(error)
        dialog.run()
        dialog.destroy()
```

---

## Appendix B: Configuration Reference

### Complete config.toml

```toml
# ~/.config/cliplingua/config.toml

[groq]
# API key (or use environment variable GROQ_API_KEY)
# api_key = "gsk_xxxxxxxxxxxxxxxxxxxx"

# Model to use
model = "llama-3.1-8b-instant"

# Request timeout (seconds)
timeout = 10

# Max retry attempts
max_retries = 3

[hotkeys]
# Keyboard shortcuts (X11 only)
translate = "<ctrl>+<alt>+t"
grammar = "<ctrl>+<alt>+g"

[limits]
# Maximum characters per request
max_chars = 4000

[ui]
# Popup window dimensions
window_width = 500
window_height = 300

# Font size (points)
font_size = 12

[logging]
# Log level: DEBUG, INFO, WARNING, ERROR
level = "INFO"

# Log file path (optional, default: journald)
# file = "~/.local/share/cliplingua/cliplingua.log"
```

---

## Appendix C: Architecture Diagrams

### Component Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                         main.py                          │
│                    (Entry Point)                         │
└────────────────┬────────────────────────────────────────┘
                 │
      ┌──────────┼──────────┐
      │          │           │
      ▼          ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Config   │ │ Groq     │ │ Hotkey   │
│ Manager  │ │ Client   │ │ Manager  │
└──────────┘ └────┬─────┘ └────┬─────┘
                   │            │
                   ▼            ▼
             ┌────────────────────┐
             │  Task Orchestrator │
             └────────┬───────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌───────────┐ ┌─────────┐ ┌──────────┐
  │ Selection │ │ Prompts │ │ PopupUI  │
  │ Manager   │ │ Service │ │ (GTK)    │
  └───────────┘ └─────────┘ └──────────┘
```

---

## Conclusion

ClipLingua là một production-ready AI translation tool với:

- ✅ **Architecture chắc chắn**: Separation of concerns, error handling, async operations
- ✅ **Security best practices**: API key management, data privacy, secure config
- ✅ **Cross-platform**: X11 và Wayland support với fallback strategies
- ✅ **User-friendly**: Minimal UI, clear feedback, keyboard shortcuts
- ✅ **Maintainable**: Clean code, comprehensive testing, good documentation
- ✅ **Scalable**: Plugin architecture cho future features

**Estimated development time**: 3-5 days cho MVP, 2-3 weeks cho production-ready version.

**Resources needed**:
- 1 Python developer (mid-senior level)
- Groq API key (free tier OK for development)
- Ubuntu testing environment (X11 + Wayland)

---

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Add tests
4. Submit PR

## License

MIT License - see LICENSE file

## Support

- GitHub Issues: https://github.com/yourusername/cliplingua/issues
- Documentation: https://cliplingua.dev
- Email: support@cliplingua.dev

---

**Last updated**: 2025-12-26
**Version**: 1.0.0
