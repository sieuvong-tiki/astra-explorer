import React from "react";
import Moment from "moment";
import styled from "styled-components";
import { Route, Switch } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import BlockDetail from "./pages/BlockDetail";
import TransactionDetail from "./pages/TransactionDetail";
import AddressDetail from "./pages/AddressDetail";
import AstraImg from "./assets/images/astra.png";
import { Header } from "antd/lib/layout/layout";
import { useHistory } from "react-router-dom";
import { Avatar, Input } from "antd";
import { Link } from "react-router-dom";

import "antd/dist/antd.css";

Moment.updateLocale("en", {
  relativeTime: {
    s: (number) => number + "s",
  },
});

const MasterLayout = styled.div`
  --layout-width: 1000px;
  --header-height: 64px;
  display: grid;
  grid-template-rows: var(--header-height) minmax(0, 1fr);
  width: 100%;

  .ant-layout-header {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 9999;

    display: grid;
    grid-template-columns: fit-content(200px) minmax(0, 1fr);
    grid-gap: 24px;
    align-items: center;

    > .logo {
      display: flex;
      grid-gap: 8px;
      align-items: center;
      font-size: 22px;
      font-weight: 500;
      color: white;
      user-select: none;
    }
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 24px;
  width: 80vw;
  max-width: var(--layout-width);
  margin: 0 auto;
  padding: 12px 0;

  .ant-col {
    word-break: break-all;
  }
`;

function App() {
  const history = useHistory();

  const handleSearch = React.useCallback((value) => {
    const height = /^\d+$/;
    const txhash = /^[A-Z\d]{64}$/;
    const addr = /^[a-z]{2,6}1[a-z\d]{38}$/;
    if (height.test(value)) {
      history.push(`/block/${value}`);
    } else if (txhash.test(value)) {
      history.push(`/transaction/${value}`);
    } else if (addr.test(value)) {
      history.push(`/address/${value}`);
    }
  }, []);

  return (
    <MasterLayout>
      <Header>
        <Link to="/" className="logo">
          <Avatar src={AstraImg} size={40} />
          <div>Astra Explorer</div>
        </Link>
        <Input.Search onSearch={handleSearch} placeholder="Search Height/Transaction/Address" />
      </Header>
      <ContentWrapper>
        <Switch>
          <Route path="/block/:height">
            <BlockDetail />
          </Route>
          <Route path="/transaction/:hash">
            <TransactionDetail />
          </Route>
          <Route path="/address/:address">
            <AddressDetail />
          </Route>
          <Route path="/" exact>
            <Dashboard />
          </Route>
        </Switch>
      </ContentWrapper>
    </MasterLayout>
  );
}

export default App;
