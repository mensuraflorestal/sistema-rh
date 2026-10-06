import glob
import os
import struct
from datetime import datetime
import pandas as pd
import xlrd

from app.core.database import SessionLocal, init_db
from app.modules.colaboradores.models import Colaborador

PASTA_CARGAS = "cargas"

MAPA_EMPRESAS = {
    "237": "MATRIZ RS",
    "245": "FILIAL MS",
    "247": "FILIAL RS"
}

def carregar_planilha_dominio(caminho: str) -> pd.DataFrame:
    """Lê e ajusta a estrutura OLE2/BIFF8 do Domínio dinamicamente."""
    with open(caminho, "rb") as f:
        raw_data = bytearray(f.read())

    sector_size = 512
    header = raw_data[:512]
    dir_first_sector = struct.unpack("<I", header[48:52])[0]
    msat = [struct.unpack("<I", header[76 + 4 * i : 80 + 4 * i])[0] for i in range(109)]
    fat_sectors = [s for s in msat if s < 0xFFFFFFFD]
    fat = []
    for fs in fat_sectors:
        offset = (fs + 1) * sector_size
        fat.extend(struct.unpack(f"<{sector_size // 4}I", raw_data[offset : offset + sector_size]))

    def get_chain(start_sec):
        chain = []
        curr = start_sec
        while curr < 0xFFFFFFFC and curr < len(fat):
            chain.append(curr)
            curr = fat[curr]
        return chain

    dir_chain = get_chain(dir_first_sector)
    dir_data = b"".join(raw_data[(s + 1) * sector_size : (s + 2) * sector_size] for s in dir_chain)

    wb_start_sec = None
    wb_size = None
    for i in range(0, len(dir_data), 128):
        entry = dir_data[i : i + 128]
        if len(entry) < 128:
            break
        name_len = struct.unpack("<H", entry[64:66])[0]
        if name_len == 0:
            continue
        name = entry[:name_len].decode("utf-16-le", errors="ignore").rstrip("\x00")
        if name.lower() in ["workbook", "book"]:
            wb_start_sec = struct.unpack("<I", entry[116:120])[0]
            wb_size = struct.unpack("<Q", entry[120:128])[0]
            break

    if wb_start_sec is None:
        raise ValueError(f"Fluxo Workbook não encontrado em {caminho}")

    wb_chain = get_chain(wb_start_sec)
    wb_data = bytearray(b"".join(raw_data[(s + 1) * sector_size : (s + 2) * sector_size] for s in wb_chain)[:wb_size])

    bof_pos = wb_data.find(b"\t\x08\x10\x00\x00\x06\x10\x00")
    boundsheet_pos = wb_data.find(b"\x85\x00")

    if boundsheet_pos != -1 and bof_pos != -1:
        current_subpos = struct.unpack("<I", wb_data[boundsheet_pos + 4 : boundsheet_pos + 8])[0]
        if current_subpos != bof_pos:
            struct.pack_into("<I", wb_data, boundsheet_pos + 4, bof_pos)
            for i, s in enumerate(wb_chain):
                chunk = wb_data[i * sector_size : (i + 1) * sector_size]
                raw_data[(s + 1) * sector_size : (s + 1) * sector_size + len(chunk)] = chunk

    if len(raw_data) % 512 != 0:
        raw_data.extend(b"\x00" * (512 - (len(raw_data) % 512)))

    wb = xlrd.open_workbook(file_contents=bytes(raw_data))
    sheet = wb.sheet_by_index(0)
    headers = [str(sheet.cell_value(0, c)).strip() for c in range(sheet.ncols)]
    rows = []
    for r in range(1, sheet.nrows):
        rows.append({headers[c]: sheet.cell_value(r, c) for c in range(sheet.ncols)})
    return pd.DataFrame(rows)


def limpar_str(v):
    if not v or pd.isna(v) or str(v).strip() in ["", "nan", "None", "-", " - "]:
        return None
    return str(v).strip()


def limpar_data(v):
    if not v or pd.isna(v) or str(v).strip() in ["", "nan", "None"]:
        return None
    try:
        return pd.to_datetime(v, dayfirst=True).date()
    except Exception:
        return None


def limpar_num(v):
    if not v or pd.isna(v) or str(v).strip() in ["", "nan", "None"]:
        return None
    try:
        return float(str(v).replace(",", "."))
    except Exception:
        return None


def extrair_dados_bancarios(row):
    banco = limpar_str(row.get("Nome Banco"))
    tipo_conta = limpar_str(row.get("Tipo Conta"))
    
    ag = limpar_str(row.get("Agencia"))
    cc = limpar_str(row.get("Conta"))
    vazio = limpar_str(row.get(""))

    if cc and str(cc).startswith("-"):
        cc = None
    if ag and str(ag).startswith("-"):
        ag = None

    if not ag and vazio:
        ag = vazio

    return banco, tipo_conta, ag, cc


def executar_carga_geral():
    ficheiros = glob.glob(os.path.join(PASTA_CARGAS, "*.xls*"))
    if not ficheiros:
        ficheiros = glob.glob("*.xls")

    if not ficheiros:
        print(f"Erro: Nenhum ficheiro .xls encontrado na pasta '{PASTA_CARGAS}' ou na raiz.")
        return

    print("A inicializar tabelas no PostgreSQL...")
    init_db()
    db = SessionLocal()

    total_inseridos = 0
    total_atualizados = 0

    # Cache de CPFs em memória para evitar duplicação entre folhas
    colaboradores_por_cpf = {}

    try:
        for caminho in sorted(ficheiros):
            nome_arq = os.path.basename(caminho)
            print(f"\nA ler folha: {nome_arq}...")
            df = carregar_planilha_dominio(caminho)
            print(f"-> {len(df)} colaboradores encontrados no ficheiro.")

            for _, row in df.iterrows():
                nome = limpar_str(row.get("Nome"))
                if not nome:
                    continue

                sit = str(row.get("Situação", "")).lower()
                status = "ATIVO"
                if "demitido" in sit:
                    status = "INATIVO"
                elif "doença" in sit or "afastado" in sit or "acidente" in sit:
                    status = "AFASTADO"

                cpf = limpar_str(row.get("CPF"))
                if cpf:
                    cpf = "".join(filter(str.isdigit, cpf)).zfill(11)

                cod_empresa = limpar_str(row.get("Cód Emp"))
                empresa_nome = MAPA_EMPRESAS.get(cod_empresa, f"Empresa {cod_empresa}" if cod_empresa else "Matriz")
                depto = limpar_str(row.get("Descrição Dpto"))
                unidade_str = f"{empresa_nome} - {depto}" if depto and depto != "Departamento" else empresa_nome

                banco, tipo_conta, agencia, conta = extrair_dados_bancarios(row)

                dados = {
                    "registro": limpar_str(row.get("Cód Epr")),
                    "nome": nome.upper(),
                    "status": status,
                    "funcao": limpar_str(row.get("Descrição cargo")),
                    "cbo": limpar_str(row.get("CBO")),
                    "grupo": limpar_str(row.get("Descrição Ccusto")),
                    "matriz_filial": unidade_str,
                    "salario": limpar_num(row.get("Salário")),
                    "jornada": limpar_str(row.get("Jornada")),
                    "data_admissao": limpar_data(row.get("Admissão")),
                    "data_demissao": limpar_data(row.get("Data Demissão")),
                    "motivo_demissao": limpar_str(row.get("Motivo Demissão")),
                    "fim_experiencia_1": limpar_data(row.get("Fim Determinado")),
                    "fim_experiencia_2": limpar_data(row.get("Fim Prorrogação")),
                    "data_nascimento": limpar_data(row.get("Data nascimento")),
                    "sexo": limpar_str(row.get("Sexo")),
                    "estado_civil": limpar_str(row.get("Estado Civil")),
                    "raca_cor": limpar_str(row.get("Raça/Cor")),
                    "grau_instrucao": limpar_str(row.get("Grau instrução")),
                    "naturalidade": limpar_str(row.get("Cidade nascimento")),
                    "uf_naturalidade": limpar_str(row.get("UF Nasc.")),
                    "nome_mae": limpar_str(row.get("Nome Mãe")),
                    "nome_pai": limpar_str(row.get("Nome Pai")),
                    "celular": limpar_str(row.get("Celular")) or limpar_str(row.get("Telefone")),
                    "cpf": cpf,
                    "rg": limpar_str(row.get("RG")),
                    "uf_rg": limpar_str(row.get("UF RG")),
                    "orgao_rg": limpar_str(row.get("Orgão RG")),
                    "expedicao_rg": limpar_data(row.get("Data EX")),
                    "pis": limpar_str(row.get("PIS")),
                    "ctps_numero": limpar_str(row.get("CTPS")),
                    "ctps_serie": limpar_str(row.get("Serie CTPS")),
                    "uf_ctps": limpar_str(row.get("UF CTPS")),
                    "cnh": limpar_str(row.get("CNH")),
                    "categoria_cnh": limpar_str(row.get("Categoria")),
                    "titulo_eleitor": limpar_str(row.get("Titulo")),
                    "zona_titulo": limpar_str(row.get("Zona")),
                    "secao_titulo": limpar_str(row.get("Seção")),
                    "reservista": limpar_str(row.get("Reservista")),
                    "cep": limpar_str(row.get("Cep")),
                    "endereco": limpar_str(row.get("Endereço")),
                    "numero": limpar_str(row.get("Numero")),
                    "complemento": limpar_str(row.get("Complemento")),
                    "bairro": limpar_str(row.get("Bairro")),
                    "cidade": limpar_str(row.get("Cidade")),
                    "uf_endereco": limpar_str(row.get("UF End")),
                    "banco": banco,
                    "agencia": agencia,
                    "numero_conta": conta,
                    "tipo_conta": tipo_conta,
                    "possui_deficiencia": limpar_str(row.get("Possui deficiência")) or "Não",
                }

                # Busca no cache ou no banco
                colab = None
                if cpf and cpf in colaboradores_por_cpf:
                    colab = colaboradores_por_cpf[cpf]
                elif cpf:
                    colab = db.query(Colaborador).filter(Colaborador.cpf == cpf).first()

                if colab:
                    # Se o novo registro é ATIVO ou o existente era INATIVO, atualiza
                    if status == "ATIVO" or colab.status != "ATIVO":
                        for k, v in dados.items():
                            if v is not None:
                                setattr(colab, k, v)
                    total_atualizados += 1
                else:
                    colab = Colaborador(**dados)
                    db.add(colab)
                    db.flush()  # Garante persistência imediata na sessão
                    total_inseridos += 1

                if cpf:
                    colaboradores_por_cpf[cpf] = colab

        db.commit()
        print("\n" + "=" * 50)
        print("Concluído com sucesso!")
        print(f"Colaboradores únicos inseridos: {total_inseridos}")
        print(f"Colaboradores transferidos/atualizados: {total_atualizados}")
        print("=" * 50)
    except Exception as e:
        db.rollback()
        print(f"Erro durante a importação: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    executar_carga_geral()