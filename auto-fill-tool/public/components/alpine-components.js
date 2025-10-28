/**
 * Alpine.js共通コンポーネント定義
 *
 * このファイルは全HTMLファイルで読み込まれ、再利用可能なAlpine.jsコンポーネントを提供します。
 */

// ボタンコンポーネント
window.appButton = function (variant = 'primary', size = 'md', icon = null) {
  return {
    variant,
    size,
    icon,
    get buttonClass() {
      const baseClass = 'btn';
      const variantClass = `btn-${this.variant}`;
      const sizeClass = this.size !== 'md' ? `btn-${this.size}` : '';
      return `${baseClass} ${variantClass} ${sizeClass}`.trim();
    },
  };
};

// カードコンポーネント
window.appCard = function (title = '') {
  return {
    title,
    cardClass: 'card',
  };
};

// モーダルコンポーネント
window.appModal = function (title = '', initialShow = false) {
  return {
    show: initialShow,
    title,

    open() {
      this.show = true;
    },

    close() {
      this.show = false;
    },

    toggle() {
      this.show = !this.show;
    },
  };
};

// トーストコンポーネント
window.appToast = function (message = '', type = 'info', duration = 5000) {
  return {
    visible: false,
    message,
    type,
    duration,

    show(msg, toastType = 'info') {
      this.message = msg;
      this.type = toastType;
      this.visible = true;

      setTimeout(() => {
        this.hide();
      }, this.duration);
    },

    hide() {
      this.visible = false;
    },

    get toastClass() {
      const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500',
      };
      return `fixed bottom-4 right-4 z-50 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${typeClasses[this.type]}`;
    },
  };
};

// テーブルコンポーネント
window.appTable = function (items = [], sortBy = '', sortDirection = 'asc') {
  return {
    items,
    sortBy,
    sortDirection,

    get sortedItems() {
      if (!this.sortBy) return this.items;

      return [...this.items].sort((a, b) => {
        const aVal = a[this.sortBy];
        const bVal = b[this.sortBy];

        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    },

    sort(column) {
      if (this.sortBy === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = column;
        this.sortDirection = 'asc';
      }
    },
  };
};

// フォームコンポーネント
window.appForm = function (initialData = {}) {
  return {
    data: { ...initialData },
    errors: {},

    validate(rules) {
      this.errors = {};
      for (const [field, rule] of Object.entries(rules)) {
        const value = this.data[field];
        const error = this.getValidationError(field, value, rule);
        if (error) {
          this.errors[field] = error;
        }
      }
      return Object.keys(this.errors).length === 0;
    },

    // eslint-disable-next-line complexity
    getValidationError(field, value, rule) {
      if (rule.required && !value) {
        return `${field}は必須です`;
      }
      if (rule.minLength && value && value.length < rule.minLength) {
        return `${field}は${rule.minLength}文字以上である必要があります`;
      }
      if (rule.maxLength && value && value.length > rule.maxLength) {
        return `${field}は${rule.maxLength}文字以下である必要があります`;
      }
      if (rule.pattern && value && !rule.pattern.test(value)) {
        return rule.message || `${field}の形式が正しくありません`;
      }
      return null;
    },

    reset() {
      this.data = { ...initialData };
      this.errors = {};
    },
  };
};

// ドロップダウンコンポーネント
window.appDropdown = function () {
  return {
    open: false,

    toggle() {
      this.open = !this.open;
    },

    close() {
      this.open = false;
    },
  };
};

// タブコンポーネント
window.appTabs = function (defaultTab = 'tab1') {
  return {
    activeTab: defaultTab,

    isActive(tab) {
      return this.activeTab === tab;
    },

    setActive(tab) {
      this.activeTab = tab;
    },
  };
};

// ページネーションコンポーネント
window.appPagination = function (items = [], itemsPerPage = 10) {
  return {
    currentPage: 1,
    itemsPerPage,

    get totalPages() {
      return Math.ceil(items.length / this.itemsPerPage);
    },

    get paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return items.slice(start, end);
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  };
};

// ローディングコンポーネント
window.appLoading = function () {
  return {
    loading: false,

    async withLoading(asyncFn) {
      this.loading = true;
      try {
        await asyncFn();
      } finally {
        this.loading = false;
      }
    },
  };
};

console.log('✅ Alpine.js共通コンポーネントが読み込まれました');
