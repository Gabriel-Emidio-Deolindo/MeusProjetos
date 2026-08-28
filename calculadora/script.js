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
const salesStorageKey = "brownie-sales-history";
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
    .map((sale) => {
      const savedAt = sale.savedAt || `${sale.date}T12:00:00`;
      const savedDate = new Date(savedAt);
      const dateLabel = savedDate.toLocaleDateString("pt-BR");
      const timeLabel = sale.savedAt
        ? savedDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "horário não disponível";

      return `
        <div class="history-row">
          <div class="history-date">
            <time datetime="${savedAt}">${dateLabel}</time>
            <span>${timeLabel}</span>
          </div>
          <strong>${sale.quantity} ${sale.quantity === 1 ? "brownie vendido" : "brownies vendidos"}</strong>
        </div>`;
    })
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
  const savedAt = new Date().toISOString();
  history.unshift({
    date: savedAt.slice(0, 10),
    savedAt,
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
