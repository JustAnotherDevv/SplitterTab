## Splitter Tab

<p align="center">
<br />
    <img src="https://github.com/user-attachments/assets/c80a8cf2-0769-49a9-b277-9cdcc30e77dd" width="400" alt="logo"/>
<br />
</p>
<p align="center"><strong style="font-size: 24px;">Group Splitting Payment App.</strong></p>
<p align="center" style="display: flex; justify-content: center; align-items: center;">
    <span style="display: inline-flex; align-items: center; background-color: #1c1c1c; padding: 5px; border-radius: 6px;">
        <img src="https://img.shields.io/github/stars/jjjutla/melodot?style=social" alt="GitHub stars"/>
        <span style="margin: 0 10px; color: white; font-size: 14px;"></span>
        <a href="https://www.easya.io/">
            <img src="https://github.com/user-attachments/assets/09cfc307-f04f-4225-8c3b-bc96c47583a6" alt="EasyA" style="height: 21px;"/>
        </a>
    </span>
</p>

---

Make group payments faster, and effortless, and delay worries about extending funds with just a few clicks. 

The Payment Splitter dApp is designed to simplify group payments and make sharing costs as easy as possible for anyone, whether splitting a bill, organizing a group gift, or settling expenses after a trip. With a sleek mobile-first design, the app allows users to interact intuitively and ensures that everyone can quickly settle up.

The app offers multiple features for better usability, including user-friendly payment splitting, expense management, and automatic cost calculations.

```mermaid
graph TD
    A[User] -->|Interacts with| B[React Mobile-first dApp]
    B -->|Sends requests to| D[Stellar Network]
    D -->|Executes| E[Smart Contract]
    E -->|Manages| F[Payment Splitting Logic]
    F -->|Sends| G[Stablecoins]
    G -->|To| H[Recipients]
    
    subgraph Frontend
    B -->|State Management| I[React Hooks/Context]
    B -->|UI Components| J[shadcn/ui]
    B -->|Auth| K[Passkeys / Freighter]
    end
    
    subgraph Stellar
    D -->|Account Management| N[Stellar Accounts]
    D -->|Transaction Handling| O[Stellar SDK]
    end
```

### Links

- [Live Demo](https://splittertab.vercel.app/)
- [Demo](https://www.loom.com/share/930ee89b5d7a4f12b8a0923dd61c431c?sid=c239ff8f-8ca2-4d30-b24b-99ee91baf506))
- [Pitch Deck](https://www.canva.com/design/DAGTabHuIc4/BDLopYPbazWElCHx-Q-Z7A/edit?utm_content=DAGTabHuIc4&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
)

### Problem

While blockchain technology is becoming increasingly popular in the finance sector and among software engineers, there remains a significant divide between everyday users and those more experienced with cryptocurrencies. The payment splitting app aims to bridge this gap by offering a simple, intuitive tool that can be adopted by a mainstream audience.

One key challenge faced by users in big groups or those in a rush is the time and effort required to manually calculate and track individual expenses. This app solves that problem by offering fast and efficient payment splitting without needing detailed input from each participant. Users can quickly divide costs, even for large groups, without the hassle of collecting too much information.

The app’s streamlined process allows users to split expenses and execute payments on the go, making it perfect for situations where time is of the essence, like dining with friends, travelling, or group activities. By leveraging blockchain technology and automation, the app ensures smooth, secure transactions while minimizing the complexity for everyday users.

### Images

<img width="1728" alt="Screenshot 2024-10-13 at 11 50 51" src="https://github.com/user-attachments/assets/3577fe7d-3677-4736-b71b-48b428ea3a70">

<img width="1728" alt="image" src="https://github.com/user-attachments/assets/6ae7d45f-e28d-47da-af84-02fe3f3ce967">

<img width="1728" alt="image" src="https://github.com/user-attachments/assets/d7585a3a-dd8e-45ef-83d6-75919dfd2747">

<img width="1728" alt="image" src="https://github.com/user-attachments/assets/7dfc9f20-2144-4d6d-a1ce-8aff8e76d929">

<img width="1728" alt="Screenshot 2024-10-13 at 11 53 27" src="https://github.com/user-attachments/assets/e800d840-7844-46ff-a3f8-89d0e766c4e8">


## Features

- Payment Splitting (By Full, By Item, Evenly)
- Lending and Borrowing Compatibility
- Creating Groups/Expenses
- Receipt OCR system to extract the specific costs
- Simple and intuitive UI thanks to Passkeys Integration
  
## Tech Stack

- **Dapp** - React + Vite + shadcn/ui
- **Web3** - Stellar + Soroban smart contracts
- **Auth** - Passkeys / Freigther

 ## Tech Team 

- @nevvdevv 
- **NOÉ DE LARMINAT** - noe.de.91@gmail.com | @NodeLarminat
- **CINDY CIENIEK** - cindycieniek@gmail.com | @ciencck28593

## Getting Started

- Install dependenciex - `pnpm i`
- Build smart Soroban smart contracts and deploy to chosen network(optional)
- Copy content of `.env.example` to `.env` and fill it out with your variables
- Start dapp with command `pnpm run dev`
