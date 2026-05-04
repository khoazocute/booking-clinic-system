# Assets Structure

Thu muc `assets` duoc dung de luu tai nguyen local cho frontend.

## Cau truc de xuat

- `images/`
  - `home/`: anh cho trang chu, hero banner, section minh hoa
  - `doctors/`: avatar, anh bac si
  - `specialties/`: anh/chu de cho chuyen khoa
- `icons/`
  - `common/`: icon dung chung trong app
  - `status/`: icon cho pending, confirmed, completed, paid...
- `illustrations/`
  - anh minh hoa, empty state, onboarding

## Cach dung

Vi du import anh:

```jsx
import heroImage from "../assets/images/home/hero-doctor.jpg";
```

```jsx
<img src={heroImage} alt="Hero doctor" />
```

Vi du import icon svg:

```jsx
import stethoscopeIcon from "../assets/icons/common/stethoscope.svg";
```

## Luu y

- `node_modules` va `dist` khong thuoc `assets`, khong commit.
- Moi folder co `.gitkeep` de Git giu cau truc ngay ca khi chua co file that.
