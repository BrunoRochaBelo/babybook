/**
 * Checkout Styles
 *
 * Estilos do modal de checkout usando Tailwind-like classes
 * que podem ser injetadas no head
 */

export function injectCheckoutStyles(): void {
  if (document.getElementById("checkout-styles")) return;

  const styles = document.createElement("style");
  styles.id = "checkout-styles";
  styles.textContent = `
    /* Modal Base */
    .checkout-modal {
      font-family: 'Inter', system-ui, sans-serif;
    }
    
    /* Backdrop animation */
    .checkout-backdrop {
      transition: opacity 0.3s ease-out;
    }
    
    /* Panel animation */
    .checkout-panel {
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    }
    
    /* Option hover effect */
    .checkout-option {
      transition: all 0.2s ease-out;
    }
    
    .checkout-option:hover {
      transform: translateY(-2px);
    }
    
    .checkout-option:active {
      transform: translateY(0);
    }
    
    /* Payment method buttons */
    .payment-method-btn {
      transition: all 0.2s ease-out;
    }
    
    .payment-method-btn:hover {
      transform: scale(1.02);
    }
    
    /* Input focus styles */
    .checkout-modal input:focus,
    .checkout-modal textarea:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    /* Error shake animation */
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    
    .shake {
      animation: shake 0.5s ease-in-out;
    }
    
    /* Loading spinner */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    /* Bounce animation for success */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .animate-bounce {
      animation: bounce 1s ease-in-out infinite;
    }
    
    /* Progress dots */
    .checkout-step-dot {
      transition: all 0.3s ease-out;
    }
    
    .checkout-step-line {
      transition: all 0.3s ease-out;
    }
    
    /* Scrollbar styling */
    .checkout-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .checkout-content::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .checkout-content::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }
    
    .checkout-content::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .checkout-panel {
        max-height: 100vh;
        border-radius: 1.5rem 1.5rem 0 0;
        margin-top: auto;
      }
      
      .checkout-container {
        align-items: flex-end;
        padding: 0;
      }
      
      .checkout-content {
        max-height: calc(100vh - 180px) !important;
      }
    }
    
    /* Trust badges animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .checkout-modal .fade-in-up {
      animation: fadeInUp 0.4s ease-out forwards;
    }
    
    /* QR Code placeholder styling */
    .checkout-modal .qr-placeholder {
      background: linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 200%;
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  document.head.appendChild(styles);
}
