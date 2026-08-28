class CalculadoraVendas {
  constructor(custoTotalIngredientes, precoFinalVenda) {
    if (custoTotalIngredientes < 0 || precoFinalVenda < 0) {
      throw new Error("Os valores não podem ser negativos.");
    }

    this.custoTotalIngredientes = custoTotalIngredientes;
    this.precoFinalVenda = precoFinalVenda;
  }

  calcularMargemLucroPorUnidade() {
    return this.precoFinalVenda - this.custoTotalIngredientes;
  }

  calcularUnidadesParaMeta(metaLucro = 800) {
    if (metaLucro < 0) {
      throw new Error("A meta de lucro não pode ser negativa.");
    }

    const margemPorUnidade = this.calcularMargemLucroPorUnidade();

    if (margemPorUnidade <= 0) {
      throw new Error(
        "O preço de venda deve ser maior que o custo dos ingredientes.",
      );
    }

    return Math.ceil(metaLucro / margemPorUnidade);
  }
}

const salesForm = document.querySelector("#sales-form");
const unitProfit = document.querySelector("#unit-profit");
const unitsNeeded = document.querySelector("#units-needed");
const goalValue = document.querySelector("#goal-value");
const message = document.querySelector("#message");
const dailySalesForm = document.querySelector("#daily-sales-form");
const salesHistory = document.querySelector("#sales-history");
const totalUnits = document.querySelector("#total-units");
const dailyMessage = document.querySelector("#daily-message");
const installButton = document.querySelector("#install-button");
const installMessage = document.querySelector("#install-message");
const salesStorageKey = "brownie-sales-history";
let installPrompt;
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function loadSalesHistory() {
  try {
    return JSON.parse(localStorage.getItem(salesStorageKey)) || [];
  } catch {
    return [];
  }
}

function renderSalesHistory() {
  const history = loadSalesHistory();
  const total = history.reduce((sum, sale) => sum + sale.quantity, 0);
  totalUnits.textContent = `${total} ${total === 1 ? "unidade" : "unidades"}`;

  if (history.length === 0) {
    salesHistory.innerHTML =
      '<p class="empty-history">Nenhuma venda registrada ainda.</p>';
    return;
  }

  salesHistory.innerHTML = history
    .map(
      (sale) => `
        <div class="history-row">
          <time datetime="${sale.date}">${new Date(`${sale.date}T12:00:00`).toLocaleDateString("pt-BR")}</time>
          <strong>${sale.quantity} ${sale.quantity === 1 ? "brownie vendido" : "brownies vendidos"}</strong>
        </div>`,
    )
    .join("");
}

salesForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const ingredientCost = Number(
    document.querySelector("#ingredient-cost").value,
  );
  const salePrice = Number(document.querySelector("#sale-price").value);
  const weeklyGoal = Number(document.querySelector("#weekly-goal").value);

  try {
    const calculator = new CalculadoraVendas(ingredientCost, salePrice);
    const unitsForGoal = calculator.calcularUnidadesParaMeta(weeklyGoal);
    unitProfit.textContent = currency.format(
      calculator.calcularMargemLucroPorUnidade(),
    );
    goalValue.textContent = currency.format(weeklyGoal);
    unitsNeeded.textContent = unitsForGoal;
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message;
    goalValue.textContent = currency.format(0);
    unitProfit.textContent = currency.format(0);
    unitsNeeded.textContent = "0";
  }
});

dailySalesForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const unitsSold = Number(document.querySelector("#units-sold-today").value);

  if (!Number.isInteger(unitsSold) || unitsSold < 1) {
    dailyMessage.textContent = "Informe uma quantidade inteira maior que zero.";
    return;
  }

  const history = loadSalesHistory();
  history.unshift({
    date: new Date().toISOString().slice(0, 10),
    quantity: unitsSold,
  });
  localStorage.setItem(salesStorageKey, JSON.stringify(history));
  dailySalesForm.reset();
  dailyMessage.textContent = "Venda registrada com sucesso.";
  renderSalesHistory();
});

renderSalesHistory();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});

installButton.addEventListener("click", async () => {
  if (installPrompt) {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      installMessage.textContent =
        "Pronto! A calculadora está sendo instalada.";
    }

    installPrompt = null;
    return;
  }

  const isAppleDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isAppleDevice) {
    installMessage.textContent =
      "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.";
    return;
  }

  installMessage.textContent =
    "Abra este app no Chrome para ver a opção de instalação no celular.";
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  installMessage.textContent = "Calculadora instalada com sucesso!";
});
