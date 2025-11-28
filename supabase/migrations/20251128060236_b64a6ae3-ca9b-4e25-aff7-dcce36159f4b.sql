-- Adicionar campos na tabela subscriptions para suportar Apple In-App Purchase
ALTER TABLE subscriptions 
ADD COLUMN apple_product_id TEXT,
ADD COLUMN apple_original_transaction_id TEXT,
ADD COLUMN payment_platform TEXT DEFAULT 'asaas';

-- Adicionar comentários nas colunas
COMMENT ON COLUMN subscriptions.apple_product_id IS 'ID do produto da Apple (ex: monthly_subscription, annual_subscription)';
COMMENT ON COLUMN subscriptions.apple_original_transaction_id IS 'ID original da transação da Apple para rastreamento';
COMMENT ON COLUMN subscriptions.payment_platform IS 'Plataforma de pagamento: asaas, apple, ou google';