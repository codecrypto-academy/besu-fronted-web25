"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../../components/ui/button";
import { Network, Node, PrefundedAccount } from "../../../types/network";

function getLocalNetworks(): Network[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("networks");
  return data ? JSON.parse(data) : [];
}

function setLocalNetworks(networks: Network[]) {
  localStorage.setItem("networks", JSON.stringify(networks));
}

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [editing, setEditing] = useState<Network | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setNetworks(getLocalNetworks());
  }, []);

  function handleSave(network: Omit<Network, "id">, id?: string) {
    let updated: Network[];
    if (id) {
      updated = networks.map((n) => (n.id === id ? { ...network, id } : n));
    } else {
      updated = [...networks, { ...network, id: uuidv4() }];
    }
    setNetworks(updated);
    setLocalNetworks(updated);
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    const updated = networks.filter((n) => n.id !== id);
    setNetworks(updated);
    setLocalNetworks(updated);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Networks</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>Crear Network</Button>
      </div>
      {showForm && (
        <NetworkForm
          key={editing?.id || "new"}
          initial={editing || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {networks.map((network) => (
          <div key={network.id} className="border rounded-lg p-4 shadow">
            <div className="font-bold text-lg mb-2">{network.network}</div>
            <div><b>IP:</b> {network.ip}</div>
            <div><b>ChainID:</b> {network.chainId}</div>
            <div><b>Signer:</b> {network.signerAccount}</div>
            <div><b>Red CIDR:</b> {network.cidr}</div>
            <div><b>Prefunded:</b> {network.prefundedAccounts.length}</div>
            <div className="mb-2">
              <b>Cuentas prefundidas:</b>
              <ul className="ml-4">
                {network.prefundedAccounts.map((acc, i) => (
                  <li key={i} className="text-xs">
                    {acc.address} - {acc.amount}
                  </li>
                ))}
              </ul>
            </div>
            <div><b>Nodos:</b> {network.nodes.length}</div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setEditing(network); setShowForm(true); }}>Editar</Button>
              <Button variant="destructive" onClick={() => handleDelete(network.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkForm({ initial, onSave, onCancel }: {
  initial?: Network,
  onSave: (network: Omit<Network, "id">, id?: string) => void,
  onCancel: () => void
}) {
  const [network, setNetwork] = useState(initial?.network || "");
  const [cidr, setCidr] = useState(initial?.cidr || "");
  const [ip, setIp] = useState(initial?.ip || "");
  const [chainId, setChainId] = useState(initial?.chainId?.toString() || "");
  const [signerAccount, setSignerAccount] = useState(initial?.signerAccount || "");
  const [prefundedCount, setPrefundedCount] = useState(initial?.prefundedAccounts?.length || 1);
  const [prefundedAccounts, setPrefundedAccounts] = useState<PrefundedAccount[]>(
    initial?.prefundedAccounts?.length
      ? initial.prefundedAccounts
      : Array(1).fill({ address: "", amount: "" })
  );
  const [nodes, setNodes] = useState<Node[]>(initial?.nodes?.length ? initial.nodes : [{ type: "rpc", ip: "" }]);

  useEffect(() => {
    setPrefundedAccounts((prev) => {
      if (prefundedCount > prev.length) {
        return [
          ...prev,
          ...Array(prefundedCount - prev.length).fill({ address: "", amount: "" })
        ];
      } else if (prefundedCount < prev.length) {
        return prev.slice(0, prefundedCount);
      }
      return prev;
    });
  }, [prefundedCount]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ network, cidr, ip, chainId: Number(chainId), signerAccount, prefundedAccounts, nodes }, initial?.id);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded p-4 mb-8">
      <div className="mb-2">
        <label className="block font-semibold">Nombre de la red</label>
        <input value={network} onChange={e => setNetwork(e.target.value)} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Red CIDR</label>
        <input value={cidr} onChange={e => setCidr(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="192.168.0.0/24" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">IP principal</label>
        <input value={ip} onChange={e => setIp(e.target.value)} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Chain ID</label>
        <input value={chainId} onChange={e => setChainId(e.target.value)} type="number" className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Cuenta firmadora (Clique)</label>
        <input value={signerAccount} onChange={e => setSignerAccount(e.target.value)} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Cantidad de cuentas prefundidas</label>
        <input type="number" min={1} value={prefundedCount} onChange={e => setPrefundedCount(Number(e.target.value))} className="border rounded px-2 py-1 w-24" />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Cuentas prefundidas</label>
        {prefundedAccounts.map((acc, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <input
              value={acc.address}
              onChange={e => {
                const copy = [...prefundedAccounts];
                copy[i] = { ...copy[i], address: e.target.value };
                setPrefundedAccounts(copy);
              }}
              className="border rounded px-2 py-1 flex-1"
              placeholder="Dirección"
              required
            />
            <input
              value={acc.amount}
              onChange={e => {
                const copy = [...prefundedAccounts];
                copy[i] = { ...copy[i], amount: e.target.value };
                setPrefundedAccounts(copy);
              }}
              className="border rounded px-2 py-1 w-32"
              placeholder="Amount"
              required
            />
          </div>
        ))}
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Nodos</label>
        {nodes.map((node, i) => (
          <div key={i} className="flex gap-2 mb-1 items-center">
            <select value={node.type} onChange={e => {
              const copy = [...nodes];
              copy[i].type = e.target.value as Node["type"];
              setNodes(copy);
            }} className="border rounded px-2 py-1">
              <option value="rpc">rpc</option>
              <option value="signer">signer</option>
              <option value="normal">normal</option>
            </select>
            <input value={node.ip} onChange={e => {
              const copy = [...nodes];
              copy[i].ip = e.target.value;
              setNodes(copy);
            }} className="border rounded px-2 py-1 flex-1" placeholder="IP del nodo" />
            <Button type="button" variant="outline" onClick={() => setNodes(n => n.filter((_, j) => j !== i))} disabled={nodes.length === 1}>-</Button>
            <Button type="button" variant="outline" onClick={() => setNodes(n => [...n, { type: "rpc", ip: "" }])}>+</Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
} 