create table public.portfolio_holdings (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    ticker text not null,
    company_name text,
    quantity numeric not null,
    average_cost numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, ticker)
);

-- Enable RLS
alter table public.portfolio_holdings enable row level security;

-- Policies
create policy "Users can view their own portfolio holdings."
    on public.portfolio_holdings for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own portfolio holdings."
    on public.portfolio_holdings for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own portfolio holdings."
    on public.portfolio_holdings for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own portfolio holdings."
    on public.portfolio_holdings for delete
    using ( auth.uid() = user_id );
