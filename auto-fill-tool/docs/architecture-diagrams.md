# アーキテクチャ図

## 概要

本ドキュメントは、Auto-Fill Toolのアーキテクチャを視覚的に表現した図を提供します。

---

## 1. レイヤー構造図

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[UI Components]
        Presenters[Presenters]
        Views[Views]
        Controllers[Controllers]
    end

    subgraph "Application Layer"
        UseCases[Use Cases]
        DTOs[DTOs]
        AppMappers[Application Mappers]
    end

    subgraph "Domain Layer"
        Entities[Entities]
        ValueObjects[Value Objects]
        DomainServices[Domain Services]
        Repositories[Repository Interfaces]
        Ports[Ports]
    end

    subgraph "Infrastructure Layer"
        RepoImpl[Repository Implementations]
        Adapters[Adapters]
        ExternalAPIs[External APIs]
        Storage[Storage Systems]
    end

    UI --> Presenters
    Presenters --> UseCases
    Controllers --> UseCases
    UseCases --> Entities
    UseCases --> DomainServices
    UseCases --> Repositories
    RepoImpl --> Repositories
    Adapters --> Ports
    RepoImpl --> Storage
    Adapters --> ExternalAPIs

    classDef presentation fill:#e1f5ff
    classDef application fill:#fff4e1
    classDef domain fill:#e1ffe1
    classDef infrastructure fill:#ffe1f5

    class UI,Presenters,Views,Controllers presentation
    class UseCases,DTOs,AppMappers application
    class Entities,ValueObjects,DomainServices,Repositories,Ports domain
    class RepoImpl,Adapters,ExternalAPIs,Storage infrastructure
```

---

## 2. データフロー図

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant P as Presenter
    participant UC as Use Case
    participant E as Entity
    participant R as Repository
    participant S as Storage

    UI->>P: User Action
    P->>UC: Execute(InputDTO)
    UC->>R: findById(id)
    R->>S: get(key)
    S-->>R: data
    R-->>UC: Result<Entity>
    UC->>E: businessMethod()
    E-->>UC: Result<Entity>
    UC->>R: save(entity)
    R->>S: set(key, data)
    S-->>R: Result<void>
    R-->>UC: Result<void>
    UC-->>P: Result<OutputDTO>
    P-->>UI: ViewModel
    UI-->>UI: Update Display
```

---

## 3. コンポーネント図

```mermaid
graph LR
    subgraph "Chrome Extension"
        Popup[Popup UI]
        ContentScript[Content Script]
        Background[Background Script]
        Options[Options Page]
    end

    subgraph "Core Application"
        Domain[Domain Layer]
        Application[Application Layer]
        Infrastructure[Infrastructure Layer]
    end

    subgraph "External Systems"
        ChromeAPI[Chrome APIs]
        LocalStorage[Local Storage]
        ChromeStorage[Chrome Storage]
        ExternalAPI[External APIs]
    end

    Popup --> Application
    ContentScript --> Application
    Background --> Application
    Options --> Application

    Application --> Domain
    Application --> Infrastructure

    Infrastructure --> ChromeAPI
    Infrastructure --> LocalStorage
    Infrastructure --> ChromeStorage
    Infrastructure --> ExternalAPI

    classDef extension fill:#e1f5ff
    classDef core fill:#e1ffe1
    classDef external fill:#ffe1f5

    class Popup,ContentScript,Background,Options extension
    class Domain,Application,Infrastructure core
    class ChromeAPI,LocalStorage,ChromeStorage,ExternalAPI external
```

---

## 4. Aggregate関係図

```mermaid
graph TD
    Website[Website Aggregate]
    AutomationVariables[AutomationVariables Aggregate]
    XPath[XPath Aggregate]
    SystemSettings[SystemSettings Aggregate]
    StorageSyncConfig[StorageSyncConfig Aggregate]

    AutomationVariables -->|websiteId| Website
    XPath -->|websiteId| Website

    subgraph "Website Context"
        Website
        AutomationVariables
        XPath
    end

    subgraph "System Context"
        SystemSettings
        StorageSyncConfig
    end

    style Website fill:#e1f5ff
    style AutomationVariables fill:#fff4e1
    style XPath fill:#ffe1f5
    style SystemSettings fill:#e1ffe1
    style StorageSyncConfig fill:#f5e1ff
```

---

## 5. Port-Adapter パターン図

```mermaid
graph LR
    subgraph "Domain Layer"
        DomainLogic[Domain Logic]
        LoggerPort[Logger Port]
        HttpPort[HTTP Client Port]
        StoragePort[Storage Port]
        CSVPort[CSV Converter Port]
    end

    subgraph "Infrastructure Layer"
        ConsoleAdapter[Console Logger Adapter]
        BackgroundAdapter[Background Logger Adapter]
        AxiosAdapter[Axios HTTP Adapter]
        ChromeAdapter[Chrome HTTP Adapter]
        LocalStorageAdapter[Local Storage Adapter]
        ChromeStorageAdapter[Chrome Storage Adapter]
        PapaParseAdapter[PapaParse CSV Adapter]
    end

    DomainLogic --> LoggerPort
    DomainLogic --> HttpPort
    DomainLogic --> StoragePort
    DomainLogic --> CSVPort

    LoggerPort <--> ConsoleAdapter
    LoggerPort <--> BackgroundAdapter
    HttpPort <--> AxiosAdapter
    HttpPort <--> ChromeAdapter
    StoragePort <--> LocalStorageAdapter
    StoragePort <--> ChromeStorageAdapter
    CSVPort <--> PapaParseAdapter

    classDef domain fill:#e1ffe1
    classDef infrastructure fill:#ffe1f5

    class DomainLogic,LoggerPort,HttpPort,StoragePort,CSVPort domain
    class ConsoleAdapter,BackgroundAdapter,AxiosAdapter,ChromeAdapter,LocalStorageAdapter,ChromeStorageAdapter,PapaParseAdapter infrastructure
```

---

## 6. エラーハンドリングフロー図

```mermaid
graph TD
    Start[Operation Start]
    Execute[Execute Operation]
    Success{Success?}
    CreateResult[Create Success Result]
    HandleError[Handle Error]
    CreateError[Create Error Result]
    LogError[Log Error]
    ReturnResult[Return Result]

    Start --> Execute
    Execute --> Success
    Success -->|Yes| CreateResult
    Success -->|No| HandleError
    CreateResult --> ReturnResult
    HandleError --> CreateError
    CreateError --> LogError
    LogError --> ReturnResult

    style Start fill:#e1ffe1
    style Success fill:#fff4e1
    style CreateResult fill:#e1f5ff
    style HandleError fill:#ffe1f5
    style ReturnResult fill:#f5e1ff
```

---

## 7. 依存関係図

```mermaid
graph TD
    subgraph "Presentation"
        P1[Popup]
        P2[Content Script]
        P3[Background]
        P4[Options]
    end

    subgraph "Application"
        A1[Use Cases]
        A2[DTOs]
        A3[Mappers]
    end

    subgraph "Domain"
        D1[Entities]
        D2[Value Objects]
        D3[Services]
        D4[Repositories]
        D5[Ports]
    end

    subgraph "Infrastructure"
        I1[Repository Impl]
        I2[Adapters]
        I3[External APIs]
    end

    P1 --> A1
    P2 --> A1
    P3 --> A1
    P4 --> A1

    A1 --> D1
    A1 --> D3
    A1 --> D4
    A3 --> D1
    A3 --> D2

    I1 --> D4
    I2 --> D5

    classDef presentation fill:#e1f5ff
    classDef application fill:#fff4e1
    classDef domain fill:#e1ffe1
    classDef infrastructure fill:#ffe1f5

    class P1,P2,P3,P4 presentation
    class A1,A2,A3 application
    class D1,D2,D3,D4,D5 domain
    class I1,I2,I3 infrastructure
```

---

## 8. テストピラミッド図

```mermaid
graph TD
    subgraph "Test Pyramid"
        E2E[E2E Tests<br/>Chrome Extension Tests]
        Integration[Integration Tests<br/>Repository Tests<br/>UseCase Tests]
        Unit[Unit Tests<br/>Entity Tests<br/>Value Object Tests<br/>Service Tests]
    end

    subgraph "Architecture Tests"
        ArchTests[Architecture Tests<br/>Dependency Rules<br/>Domain Purity<br/>Port-Adapter Pattern]
    end

    Unit --> Integration
    Integration --> E2E

    style Unit fill:#e1ffe1
    style Integration fill:#fff4e1
    style E2E fill:#ffe1f5
    style ArchTests fill:#f5e1ff
```

---

## 図の説明

### レイヤー構造図

- Clean Architectureの4層構造を表現
- 依存関係の方向（内向き）を明示
- 各層の主要コンポーネントを表示

### データフロー図

- ユーザーアクションから結果表示までの流れ
- 各層での処理とデータ変換を表現
- Result パターンの使用を明示

### コンポーネント図

- Chrome Extension の構成要素
- 外部システムとの関係
- 主要なアーキテクチャレイヤー

### Aggregate関係図

- ドメインモデルのAggregate境界
- Aggregate間の参照関係
- コンテキスト境界

### Port-Adapter パターン図

- ドメインと外部システムの分離
- 複数の実装（Adapter）の切り替え可能性
- インターフェース（Port）による抽象化

---

最終更新日: 2024年11月22日
